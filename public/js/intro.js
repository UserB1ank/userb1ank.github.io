// static/js/intro.js
import * as THREE from 'three';

export function initIntroScene(canvas, onComplete) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);

  // 蒸汽波背景渐变 (通过 CSS)
  scene.background = new THREE.Color(0x0a0a1a);

  // 创建复古 LCD 显示器
  const monitor = createMonitor();
  scene.add(monitor);

  // 添加雾效果增加深度
  scene.fog = new THREE.Fog(0x0a0a1a, 5, 20);

  // 添加网格线 (蒸汽波风格)
  const gridHelper = createGrid();
  scene.add(gridHelper);

  // 添加光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0x00ffff, 1, 50);
  pointLight.position.set(5, 5, 5);
  scene.add(pointLight);

  const pinkLight = new THREE.PointLight(0xff00ff, 0.5, 50);
  pinkLight.position.set(-5, -2, 3);
  scene.add(pinkLight);

  // 相机动画
  const startPos = new THREE.Vector3(-8, 0, 5);
  const endPos = new THREE.Vector3(0, 0, 3);

  camera.position.copy(startPos);
  camera.lookAt(0, 0, 0);

  // 动画参数
  const duration = 2500; // 2.5秒移动
  const fadeStart = 2000; // 2秒后开始淡出
  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 相机位置插值 (easeInOut)
    const easeProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    camera.position.x = startPos.x + (endPos.x - startPos.x) * easeProgress;
    camera.position.y = startPos.y + (endPos.y - startPos.y) * easeProgress;
    camera.position.z = startPos.z + (endPos.z - startPos.z) * easeProgress;

    // 相机稍微向显示器中心看
    camera.lookAt(0, 0, 0);

    // 淡出效果
    if (elapsed > fadeStart) {
      const fadeProgress = (elapsed - fadeStart) / (duration - fadeStart);
      renderer.domElement.style.opacity = 1 - fadeProgress;
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // 动画完成，跳转
      setTimeout(() => {
        if (onComplete) onComplete();
        window.location.href = '/desktop/';
      }, 300);
    }

    renderer.render(scene, camera);
  }

  animate();
}

function createMonitor() {
  const group = new THREE.Group();

  // 显示器外壳 - 圆角矩形效果用多个box模拟
  const shellMat = new THREE.MeshPhongMaterial({ color: 0x888888 });

  // 主体
  const shellMain = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 3.2, 0.4),
    shellMat
  );
  group.add(shellMain);

  // 屏幕外框
  const bezelMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 2.9, 0.1),
    bezelMat
  );
  bezel.position.z = 0.2;
  group.add(bezel);

  // 屏幕 (黑色)
  const screenMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 2.6),
    screenMat
  );
  screen.position.z = 0.26;
  group.add(screen);

  // 屏幕上的 XP logo 效果 (发光平面)
  const logoGeom = new THREE.PlaneGeometry(1, 0.8);
  const logoMat = new THREE.MeshBasicMaterial({
    color: 0x00aaff,
    transparent: true,
    opacity: 0
  });
  const logo = new THREE.Mesh(logoGeom, logoMat);
  logo.position.z = 0.27;
  group.add(logo);

  // 底部支架
  const standMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.1, 0.8),
    standMat
  );
  stand.position.y = -1.8;
  stand.position.z = -0.1;
  group.add(stand);

  // 支架连接
  const neck = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.5, 0.2),
    standMat
  );
  neck.position.y = -1.5;
  neck.position.z = 0.1;
  group.add(neck);

  // 正面品牌logo (Windows XP风格)
  const labelGeom = new THREE.PlaneGeometry(0.6, 0.15);
  const labelMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
  const label = new THREE.Mesh(labelGeom, labelMat);
  label.position.z = 0.22;
  label.position.y = -1.2;
  group.add(label);

  return group;
}

function createGrid() {
  const gridGroup = new THREE.Group();

  // 透视网格线
  const gridMat = new THREE.LineBasicMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.3
  });

  // 横向线
  for (let i = -10; i <= 0; i++) {
    const points = [
      new THREE.Vector3(-15, i, -10),
      new THREE.Vector3(15, i, -10)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, gridMat);
    gridGroup.add(line);
  }

  // 纵向线 (带透视)
  for (let i = -15; i <= 15; i += 2) {
    const points = [
      new THREE.Vector3(i, -10, -10),
      new THREE.Vector3(i * 0.3, 0, -5)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, gridMat);
    gridGroup.add(line);
  }

  return gridGroup;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('scene');
  if (canvas) {
    initIntroScene(canvas);
  }
});
