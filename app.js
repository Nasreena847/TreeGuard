import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'; 


let camera, scene, renderer, stats;
let fbxModel;
let cubeCamera, cubeRenderTarget;
let controls;
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let textMesh;

let lastTime = 0;
const updateInterval = 1000 / 60;

let videoPlaying = false; 
let currentVideo = null;

init();

function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.setClearColor(0x00000, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.body.appendChild(renderer.domElement);

    
    window.addEventListener('resize', onWindowResized);

    
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 75;

    
    scene = new THREE.Scene();

    
    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(34, {
        format: THREE.RGBAFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        encoding: THREE.sRGBEncoding
    });
    cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
    scene.add(cubeCamera);

    
    let loader = new FBXLoader();

    loader.load('texture/hex_earth.fbx', function (object) {
        fbxModel = object;
        fbxModel.scale.set(0.04, 0.04, 0.04); 
        scene.add(fbxModel);
        hideLoader(); 
        
    });
   
    
    
    loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        addTextToCubeFace(font, 'Start', new THREE.Vector3(0, 0, 15), 5); 
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    directionalLight.position.set(15, 15, 15);
    scene.add(directionalLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    const firstVideo = document.getElementById('myVideo');
    const secondVideo = document.getElementById('mySecondVideo');
    const thirdVideo = document.getElementById('myThirdVideo')

    firstVideo.addEventListener('ended', onFirstVideoEnded);
    secondVideo.addEventListener('ended', onSecondVideoEnded);
    thirdVideo.addEventListener('ended', onThirdVideoEnded)
   
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);
}


function addTextToCubeFace(font, text, direction, offset) {
    const textGeometry = new TextGeometry(text, {
        font: font,
        size: 2,
        depth: 1,
        curveSegments: 6,
    });
    textGeometry.center();

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    textMesh = new THREE.Mesh(textGeometry, textMaterial);

    textMesh.position.set(0, 0, 15); 
    scene.add(textMesh);
}

function onMouseMove(event) {
  
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
}

function onMouseClick(event) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(textMesh);
    if (intersects.length > 0) {
        if (!videoPlaying) {
            zoomInCamera();
            setTimeout(() => {
                
                    var firstVideo = document.getElementById('myVideo');
                firstVideo.muted = false; // Unmute the second video
                firstVideo.play(); // Play the second video
                document.getElementById('videoContainer').style.display = 'block'
                videoPlaying = true;
                currentVideo = 'first';
            }, 1000);

        }
    }
}


function animate(time) {
    requestAnimationFrame(animate);

 
    const deltaTime = time - lastTime;

 
    if (deltaTime > updateInterval) {
        lastTime = time - (deltaTime % updateInterval); // Adjust lastTime to account for potential frame lag

        if (fbxModel) {
            fbxModel.updateMatrixWorld();
        }

        cubeCamera.update(renderer, scene);
        if (controls && typeof controls.update === 'function') {
            controls.update();
        } else {
            console.error('controls is undefined or does not have an update method');
        }
        renderer.render(scene, camera);
        
    }
}

function hideLoader() {
    const loader = document.querySelector('.progress-loader');
    loader.style.display = 'none';
}


function zoomInCamera(callback) {
  
    const duration = 1000; 
    const start = performance.now(); 
    const initialCameraPosition = camera.position.clone();
    const targetCameraPosition = new THREE.Vector3(0, 0, 10); 

    function animateZoom(time) {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1); 

        camera.position.z = initialCameraPosition.z + (targetCameraPosition.z - initialCameraPosition.z) * progress;

        if (progress < 1) {
            requestAnimationFrame(animateZoom); 
        } else {
            camera.position.copy(targetCameraPosition); 
            if (callback) callback(); 
        }
    }

    requestAnimationFrame(animateZoom); 
}

function zoomOutCamera(callback) {
    const duration = 3000; 
    const start = performance.now(); 
    const initialCameraPosition = camera.position.clone();
    const targetCameraPosition = new THREE.Vector3(0, 0, 50); 

    function animateZoomOut(time) {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1); 

        camera.position.z = initialCameraPosition.z + (targetCameraPosition.z - initialCameraPosition.z) * progress;
        
        camera.updateProjectionMatrix();

        if (progress < 1) {
            requestAnimationFrame(animateZoomOut); 
        } else {
            camera.position.copy(targetCameraPosition);
            if (callback) callback(); 
        }
    }

    requestAnimationFrame(animateZoomOut); 
}

function onFirstVideoEnded() {
    try {
        zoomOutCamera();
        rotateGlobe();
        setTimeout(() => {
            zoomInCamera();
        }, 7000)
       
    } catch (error) {
        console.error('Error during camera operations:', error);
    }
    
   
    document.getElementById('videoContainer').style.display = 'none';
    setTimeout(() => {
       
            let secondVideo = document.getElementById('mySecondVideo');
            secondVideo.style.display = 'block';
            secondVideo.muted = false; // Unmute the second video
            secondVideo.play(); // Play the second video
        
        videoPlaying = true;
        currentVideo = 'second';
    }, 8000);
}


function onSecondVideoEnded() {
    try {
        zoomOutCamera();
        rotateGlobe();
        setTimeout(() => {
            zoomInCamera();
        }, 7000)
       
    } catch (error) {
        console.error('Error during camera operations:', error);
    }
    
    document.getElementById('mySecondVideo').style.display = 'none';
    setTimeout(() => {
       
            let thirdVideo = document.getElementById('myThirdVideo');
            thirdVideo.style.display = 'block';
            thirdVideo.muted = false; // Unmute the second video
            thirdVideo.play(); // Play the second video
        
        videoPlaying = true;
        currentVideo = 'third';
    }, 8000);
}

function onThirdVideoEnded() {
    document.getElementById('mySecondVideo').style.display = 'none'; 
    document.getElementById('videoContainer').style.display = 'none'; 
    document.getElementById('myThirdVideo').style.display = 'none'
    zoomOutCamera(() => {
        rotateGlobe(() => {
                videoPlaying = false;
                currentVideo = null;
                document.addEventListener('click', onMouseClick);
            
        });
    });
}

function rotateGlobe(callback) {
    controls.autoRotate = false;
    controls.update(); 

        function onZoomOutComplete() {

        controls.autoRotate = true;
        controls.autoRotateSpeed = 30; 

        const duration = 4000; 
        const start = performance.now(); 
        const initialRotation = fbxModel.rotation.y; 
        const targetRotation = initialRotation + Math.PI * 2; 

        function animateRotation(time) {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1); 

            fbxModel.rotation.y = initialRotation + (targetRotation - initialRotation) * progress;

            if (progress < 1) {
                requestAnimationFrame(animateRotation); 
            } else {
                controls.autoRotate = false;
                if (callback) callback(); 
            }
        }

        requestAnimationFrame(animateRotation); 
    }

 
    zoomOutCamera(onZoomOutComplete);
}


function onWindowResized() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.near = 1; 
camera.far = 5000; 

    camera.updateProjectionMatrix();
}