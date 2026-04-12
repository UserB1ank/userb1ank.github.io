---
title: "深入理解 Three.js 3D 编程"
date: 2024-01-20
category: "图形学"
---

# 深入理解 Three.js 3D 编程

Three.js 是一个强大的 JavaScript 3D 图形库。

## 基础概念

### 场景 (Scene)

场景是所有 3D 对象的容器：

```javascript
const scene = new THREE.Scene();
```

### 相机 (Camera)

相机决定了我们如何看待这个场景：

```javascript
const camera = new THREE.PerspectiveCamera(
  75,                                     // 视野角度
  window.innerWidth / window.innerHeight, // 宽高比
  0.1,                                    // 近裁切面
  1000                                    // 远裁切面
);
```

### 渲染器 (Renderer)

渲染器负责将场景绘制到屏幕上：

```javascript
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
```

## 创建物体

```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
```

## 动画循环

```javascript
function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
}

animate();
```

## 总结

Three.js 让 Web 3D 编程变得简单有趣！
