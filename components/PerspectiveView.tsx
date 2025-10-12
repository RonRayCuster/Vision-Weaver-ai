import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import type { SceneAnalysis, PropAnalysis, ActorAnalysis, CameraAnalysis, LightAnalysis, AnimationKeyframe } from '../types';
import type { SelectedItem } from './Scene3DView';
import { colors } from '../colors';
import { findSegment } from '../utils/interpolation';

interface PerspectiveViewProps {
    analysis: SceneAnalysis;
    selectedItem: SelectedItem | null;
    onSelect: (item: SelectedItem | null) => void;
    showLights: boolean;
    showCamera: boolean;
    onItemMoved: (updatedAnalysis: SceneAnalysis, movedItem: SelectedItem) => void;
    isPlaybackMode: boolean;
    currentTime?: number;
}

const SCENE_WIDTH = 10;
const SCENE_DEPTH = 10;
const SCENE_SCALE = SCENE_WIDTH / 100;

const materials = {
    actor: new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.5 }),
    camera: new THREE.MeshStandardMaterial({ color: colors.error, roughness: 0.5 }),
    prop: new THREE.MeshStandardMaterial({ color: colors['text-secondary'], roughness: 0.7 }),
    ground: new THREE.MeshStandardMaterial({ color: colors.surface, roughness: 1.0 }),
};

const get3DPosition = (pos: { x: number; y: number; z: number }) => {
    return new THREE.Vector3(
        (pos.x - 50) * SCENE_SCALE,
        pos.z * SCENE_SCALE,
        (pos.y - 50) * SCENE_SCALE
    );
};

const get2DPositionFrom3D = (vec: THREE.Vector3) => {
    return {
        x: (vec.x / SCENE_SCALE) + 50,
        y: (vec.z / SCENE_SCALE) + 50,
        z: vec.y / SCENE_SCALE,
    };
};

const getPropMesh = (prop: PropAnalysis): THREE.Object3D => {
    const name = prop.name.toLowerCase();
    let mesh: THREE.Mesh;
    
    if (name.includes('table') || name.includes('desk')) {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.6), materials.prop.clone());
        mesh.scale.set(1.2, 1.2, 1.2);
    } else if (name.includes('chair') || name.includes('sofa')) {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), materials.prop.clone());
    } else if (name.includes('lamp')) {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshBasicMaterial({ color: colors.warning }));
    } else if (name.includes('plant')) {
        mesh = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 8), materials.prop.clone());
    } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), materials.prop.clone());
    }
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
};

// Animation helpers
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const PerspectiveView: React.FC<PerspectiveViewProps> = ({ analysis, selectedItem, onSelect, showLights, showCamera, onItemMoved, isPlaybackMode, currentTime }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneObjects = useRef<THREE.Group>(new THREE.Group());
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const draggableObjects = useRef<THREE.Object3D[]>([]);
    const clock = useRef(new THREE.Clock());
    const activeAnimations = useRef<Record<string, any>>({});

    useEffect(() => {
        if (!mountRef.current) return;
        const currentMount = mountRef.current;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(colors.primary);
        const camera = new THREE.PerspectiveCamera(60, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
        camera.position.set(0, 8, 8);
        
        if (!rendererRef.current) {
             rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
        }
        const renderer = rendererRef.current;
       
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        currentMount.innerHTML = '';
        currentMount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.minDistance = 2; // Prevent zooming too close
        controls.maxDistance = 20; // Prevent zooming too far out
        controls.target.set(0, 0, 0);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(SCENE_WIDTH, SCENE_DEPTH),
            materials.ground
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        const grid = new THREE.GridHelper(SCENE_WIDTH, 10, colors.border, colors.border);
        grid.position.y = 0.01;
        scene.add(grid);
        
        scene.add(sceneObjects.current);
        
        let dragControls: DragControls | null = null;
        if (!isPlaybackMode) {
            dragControls = new DragControls(draggableObjects.current, camera, renderer.domElement);
            dragControls.addEventListener('dragstart', () => controls.enabled = false);
            dragControls.addEventListener('dragend', (event) => {
                controls.enabled = true;
                const movedObject = event.object;
                const movedItem = movedObject.userData.item as SelectedItem;
                if (!movedItem) return;

                movedObject.position.y = movedObject.userData.originalY || 0;
                
                const newPosition3D = movedObject.position;
                const newPosition2D = get2DPositionFrom3D(newPosition3D);

                const updatedAnalysis = JSON.parse(JSON.stringify(analysis));

                const findAndupdate = (collection: any[], itemData: any) => {
                    const item = collection.find(i => i.name === itemData.name);
                    if (item) {
                        item.position.x = newPosition2D.x;
                        item.position.y = newPosition2D.y;
                        item.position.z = item.position.z;
                    }
                };
                
                if (movedItem.type === 'actor') findAndupdate(updatedAnalysis.actors, movedItem.data);
                onItemMoved(updatedAnalysis, movedItem);
            });
        }

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const handleClick = (event: MouseEvent) => {
            if (!currentMount) return;
            const rect = currentMount.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(sceneObjects.current.children, true);
            
            if (intersects.length > 0) {
                let currentObject = intersects[0].object;
                while(currentObject.parent && !currentObject.userData.item) {
                     currentObject = currentObject.parent;
                }
                onSelect(currentObject.userData.item || null);
            } else {
                onSelect(null);
            }
        };
        currentMount.addEventListener('click', handleClick);

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();

            const elapsedTime = clock.current.getElapsedTime();

            // Update animations
            for (const actor of analysis.actors) {
                const animState = activeAnimations.current[actor.name];
                const actorMesh = sceneObjects.current.getObjectByName(actor.name);
                const head = actorMesh?.getObjectByName(`${actor.name}-head`);

                if (animState && actorMesh && head) {
                    const progress = Math.min(1.0, (elapsedTime - animState.startTime) / animState.duration);
                    const easedProgress = easeInOutCubic(progress);

                    head.rotation.x = lerp(animState.startRotX, animState.targetRotX, easedProgress);
                    head.rotation.y = lerp(animState.startRotY, animState.targetRotY, easedProgress);
                    head.rotation.z = lerp(animState.startRotZ, animState.targetRotZ, easedProgress);
                    
                    if (isPlaybackMode) {
                        actorMesh.position.x = lerp(animState.startPosX, animState.targetPosX, easedProgress);
                        actorMesh.position.z = lerp(animState.startPosZ, animState.targetPosZ, easedProgress);
                    }
                }
            }

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (currentMount) {
                camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            currentMount.removeEventListener('click', handleClick);
            controls.dispose();
            dragControls?.dispose();
        };
    }, [isPlaybackMode]);

     useEffect(() => {
        // This effect triggers animations based on currentTime
        if (!isPlaybackMode || currentTime === undefined) return;

        for (const actor of analysis.actors) {
            const actorMesh = sceneObjects.current.getObjectByName(actor.name);
            const head = actorMesh?.getObjectByName(`${actor.name}-head`);

            if (!actor.animation || actor.animation.length === 0 || !actorMesh || !head) continue;
            
            const currentAnimKeyframe = findSegment<AnimationKeyframe>(actor.animation, currentTime).start;
            const currentAnimState = activeAnimations.current[actor.name];
            
            // Trigger new animation if the label changes
            if (!currentAnimState || currentAnimState.label !== currentAnimKeyframe.animationLabel) {
                 const newAnimState = {
                    label: currentAnimKeyframe.animationLabel,
                    startTime: clock.current.getElapsedTime(),
                    duration: 0.8, // Smooth transition time
                    startRotX: head.rotation.x,
                    startRotY: head.rotation.y,
                    startRotZ: head.rotation.z,
                    targetRotX: 0,
                    targetRotY: 0,
                    targetRotZ: 0,
                    startPosX: actorMesh.position.x,
                    targetPosX: get3DPosition(actor.position).x,
                    startPosZ: actorMesh.position.z,
                    targetPosZ: get3DPosition(actor.position).z,
                };

                switch (currentAnimKeyframe.animationLabel) {
                    case 'subtle_head_nod': newAnimState.targetRotX = 0.2; break;
                    case 'shake_head_no': newAnimState.targetRotY = 0.5; break;
                    case 'look_down': newAnimState.targetRotX = 0.5; break;
                }
                activeAnimations.current[actor.name] = newAnimState;
            } else {
                 // Update position target for ongoing animations
                 currentAnimState.targetPosX = get3DPosition(actor.position).x;
                 currentAnimState.targetPosZ = get3DPosition(actor.position).z;
            }
        }
    }, [analysis.actors, currentTime, isPlaybackMode]);

    useEffect(() => {
        const group = sceneObjects.current;
        draggableObjects.current = [];
        while (group.children.length > 0) {
            const child = group.children[0];
            group.remove(child);
            // Clean up geometries and materials if necessary
        }

        const createDraggable = (mesh: THREE.Object3D, item: SelectedItem) => {
            mesh.userData.item = item;
            mesh.userData.originalY = mesh.position.y;
            if (!isPlaybackMode) {
                 draggableObjects.current.push(mesh);
            }
            group.add(mesh);
        }

        analysis.actors.forEach((actor) => {
            const actorGroup = new THREE.Group();
            actorGroup.name = actor.name;

            const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.8, 4, 16), materials.actor.clone());
            body.position.y = 0.5;
            body.castShadow = true;
            actorGroup.add(body);
            
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), materials.actor.clone());
            head.name = `${actor.name}-head`;
            head.position.y = 1.1; // Position head on top of body
            head.castShadow = true;
            actorGroup.add(head);

            actorGroup.position.copy(get3DPosition(actor.position));
            createDraggable(actorGroup, { type: 'actor', data: actor });
        });

        if (!isPlaybackMode) {
            analysis.props.forEach((prop) => {
                const mesh = getPropMesh(prop);
                mesh.position.copy(get3DPosition(prop.position));
                createDraggable(mesh, { type: 'prop', data: prop });
            });
        }


        if (showCamera && analysis.camera) {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.4), materials.camera.clone());
            const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2), materials.camera.clone());
            lens.rotation.z = Math.PI / 2;
            lens.position.x = -0.2;
            mesh.add(lens);
            mesh.position.copy(get3DPosition(analysis.camera.position));
            mesh.castShadow = true;
            createDraggable(mesh, { type: 'camera', data: analysis.camera });
        }

        if (showLights) {
            analysis.lights.forEach((light) => {
                const pointLight = new THREE.PointLight(colors.warning, light.intensity * 2, 10);
                pointLight.position.copy(get3DPosition(light.position));
                pointLight.castShadow = true;
                group.add(pointLight);
                
                const helper = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: colors.warning, transparent: true, opacity: 0.5 }));
                helper.position.copy(pointLight.position);
                createDraggable(helper, { type: 'light', data: light });
            });
        }
    }, [analysis, showLights, showCamera, isPlaybackMode]);

    useEffect(() => {
        sceneObjects.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh && (child.material as THREE.MeshStandardMaterial).emissive) {
                (child.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            }
        });

        if (selectedItem) {
            sceneObjects.current.traverse((child) => {
                const item = child.userData.item as SelectedItem;
                 if (item && item.type === selectedItem.type && JSON.stringify(item.data) === JSON.stringify(selectedItem.data)) {
                     let obj: THREE.Object3D = child;
                     while(obj.parent && !obj.userData.item){ obj = obj.parent }

                     obj.traverse(c => {
                         if ((c as THREE.Mesh).isMesh && (c.material as THREE.MeshStandardMaterial).emissive) {
                             (c.material as THREE.MeshStandardMaterial).emissive.set(colors.warning);
                         }
                     })
                 }
            });
        }
    }, [selectedItem]);


    return (
         <div 
            ref={mountRef} 
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
        />
    );
};

export default PerspectiveView;