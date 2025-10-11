import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { SceneReconstruction } from '../types';
import { colors } from '../colors';

interface PointCloudViewerProps {
    reconstruction: SceneReconstruction;
}

const PointCloudViewer: React.FC<PointCloudViewerProps> = ({ reconstruction }) => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current || !reconstruction.pointCloud || reconstruction.pointCloud.length === 0) {
            return;
        }

        const currentMount = mountRef.current;

        // Scene, Camera, Renderer
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(colors.surface);
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        currentMount.appendChild(renderer.domElement);

        // OrbitControls for intuitive camera manipulation
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Point Cloud Geometry
        const points = reconstruction.pointCloud;
        const positions = new Float32Array(points.length * 3);
        const colorsArr = new Float32Array(points.length * 3);
        const threeColor = new THREE.Color();

        points.forEach((p, i) => {
            positions[i * 3] = p.position.x;
            positions[i * 3 + 1] = p.position.y;
            positions[i * 3 + 2] = p.position.z;

            threeColor.set(p.color);
            colorsArr[i * 3] = threeColor.r;
            colorsArr[i * 3 + 1] = threeColor.g;
            colorsArr[i * 3 + 2] = threeColor.b;
        });
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colorsArr, 3));
        
        // This centers the geometry on its bounding box center, simplifying positioning.
        geometry.center();

        const material = new THREE.PointsMaterial({ size: 0.05, vertexColors: true });
        const pointCloud = new THREE.Points(geometry, material);
        scene.add(pointCloud);

        // Camera Poses Markers
        const cameraPoses = reconstruction.cameraPoses || [];
        const poseGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const poseMaterial = new THREE.MeshBasicMaterial({ color: colors.error });

        // We need to know the center of the original geometry to offset the cameras correctly.
        const center = new THREE.Vector3();
        geometry.computeBoundingBox();
        geometry.boundingBox?.getCenter(center);


        cameraPoses.forEach(pose => {
            const mesh = new THREE.Mesh(poseGeometry, poseMaterial);
            mesh.position.set(pose.position.x - center.x, pose.position.y - center.y, pose.position.z - center.z);
            scene.add(mesh);
        });
        
        // Auto-adjust camera to frame the entire scene
        const boundingBox = new THREE.Box3().setFromObject(pointCloud);
        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        camera.position.z = Math.abs(maxDim / Math.tan(fov / 2)) * 0.75;
        controls.target.set(0, 0, 0);
        controls.update();

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Handle window resizing
        const handleResize = () => {
            if (currentMount) {
                const width = currentMount.clientWidth;
                const height = currentMount.clientHeight;
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            }
        };
        window.addEventListener('resize', handleResize);

        // Cleanup function to prevent memory leaks
        return () => {
            window.removeEventListener('resize', handleResize);
            if (currentMount) {
                currentMount.removeChild(renderer.domElement);
            }
            controls.dispose();
            renderer.dispose();
            geometry.dispose();
            material.dispose();
            poseGeometry.dispose();
            poseMaterial.dispose();
        };
    }, [reconstruction]);

    return (
        <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
            <div ref={mountRef} className="w-full h-full" />
            <p className="absolute bottom-1 right-2 text-xs text-text-secondary pointer-events-none">3D Point Cloud (Drag to rotate, Scroll to zoom)</p>
        </div>
    );
};

export default PointCloudViewer;
