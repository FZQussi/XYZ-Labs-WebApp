let scene, camera, renderer, model;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.z = 100;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    document.getElementById('viewer').appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (model) model.rotation.y += 0.01;
    renderer.render(scene, camera);
}

function loadModel(file) {
    if (model) {
        scene.remove(model);
        model.geometry?.dispose();
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const contents = e.target.result;

        if (file.name.endsWith('.stl')) {
            const loader = new THREE.STLLoader();
            const geometry = loader.parse(contents);
            const material = new THREE.MeshStandardMaterial({ color: 0x607d8b });
            model = new THREE.Mesh(geometry, material);
            scene.add(model);
        } else if (file.name.endsWith('.3mf')) {
            const loader = new THREE.ThreeMFLoader();
            loader.parse(contents, function(result) {
                model = result;
                scene.add(model);
            });
        }
    };

    if (file.name.endsWith('.stl')) {
        reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.3mf')) {
        reader.readAsArrayBuffer(file);
    }
}

// Evento de upload
document.getElementById('upload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) loadModel(file);
});

// Inicializa a cena
init();
