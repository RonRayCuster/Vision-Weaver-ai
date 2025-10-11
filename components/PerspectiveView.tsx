import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import type { SceneAnalysis, PropAnalysis, ActorAnalysis, CameraAnalysis, LightAnalysis } from '../types';
import type { SelectedItem } from './Scene3DView';
import { colors } from '../colors';

interface PerspectiveViewProps {
    analysis: SceneAnalysis;
    selectedItem: SelectedItem | null;
    onSelect: (item: SelectedItem | null) => void;
    showLights: boolean;
    showCamera: boolean;
    onItemMoved: (updatedAnalysis: SceneAnalysis, movedItem: SelectedItem) => void;
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

const PerspectiveView: React.FC<PerspectiveViewProps> = ({ analysis, selectedItem, onSelect, showLights, showCamera, onItemMoved }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneObjects = useRef<THREE.Group>(new THREE.Group());
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const draggableObjects = useRef<THREE.Object3D[]>([]);

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
        
        const dragControls = new DragControls(draggableObjects.current, camera, renderer.domElement);
        dragControls.addEventListener('dragstart', () => controls.enabled = false);
        dragControls.addEventListener('dragend', (event) => {
            controls.enabled = true;
            const movedObject = event.object;
            const movedItem = movedObject.userData.item as SelectedItem;
            if (!movedItem) return;

            const newPosition3D = movedObject.position;
            const newPosition2D = get2DPositionFrom3D(newPosition3D);

            const updatedAnalysis = JSON.parse(JSON.stringify(analysis));

            const findAndupdate = (collection: any[], itemData: any) => {
                const item = collection.find(i => i.name === itemData.name);
                if (item) {
                    item.position.x = newPosition2D.x;
                    item.position.y = newPosition2D.y;
                    item.position.z = newPosition2D.z;
                }
            };
            
            switch (movedItem.type) {
                case 'actor': findAndupdate(updatedAnalysis.actors, movedItem.data); break;
                case 'prop': findAndupdate(updatedAnalysis.props, movedItem.data); break;
                case 'camera': 
                    updatedAnalysis.camera.position.x = newPosition2D.x;
                    updatedAnalysis.camera.position.y = newPosition2D.y;
                    updatedAnalysis.camera.position.z = newPosition2D.z;
                    break;
                case 'light':
                    const light = updatedAnalysis.lights.find((l: LightAnalysis) => l.type === movedItem.data.type && l.intensity === movedItem.data.intensity);
                     if (light) {
                        light.position.x = newPosition2D.x;
                        light.position.y = newPosition2D.y;
                        light.position.z = newPosition2D.z;
                    }
                    break;
            }
            onItemMoved(updatedAnalysis, movedItem);
        });

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
            dragControls.dispose();
        };
    }, [onItemMoved]);

    useEffect(() => {
        const group = sceneObjects.current;
        draggableObjects.current = [];
        while (group.children.length > 0) {
            group.remove(group.children[0]);
        }

        const createDraggable = (mesh: THREE.Object3D, item: SelectedItem) => {
            mesh.userData.item = item;
            draggableObjects.current.push(mesh);
            group.add(mesh);
        }

        analysis.actors.forEach((actor) => {
            const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.0), materials.actor.clone());
            mesh.position.copy(get3DPosition(actor.position));
            mesh.castShadow = true;
            createDraggable(mesh, { type: 'actor', data: actor });
        });

        analysis.props.forEach((prop) => {
            const mesh = getPropMesh(prop);
            mesh.position.copy(get3DPosition(prop.position));
            createDraggable(mesh, { type: 'prop', data: prop });
        });

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
    }, [analysis, showLights, showCamera]);

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