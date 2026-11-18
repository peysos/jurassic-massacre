/* Jurassic Massacre — articulated collision for the animal in the aquarium.
   Each rigid part uses several local mesh bounds. Sweep between accepted poses so a joint cannot move through a wall
   or deck in one frame. All played poses, including cinematics and the carcass, go through the same sweep. */
'use strict';

function aquariumCreaturePhysics(root, rig, tank, obstacles) {
  var joints = [root, rig.tail1, rig.tail2, rig.head, rig.jaw].concat(rig.segs, rig.flips);
  var shapes = [], world = new THREE.Box3(), center = new THREE.Vector3(), half = new THREE.Vector3();
  var scratch = new THREE.Vector3(), safe = null;

  joints.slice(1).concat(rig.body).forEach(function (bone) {
    var meshes = bone.children.filter(function (child) { return child.isMesh; });
    meshes.sort(function (a, b) { return b.geometry.attributes.position.count - a.geometry.attributes.position.count; });
    meshes.forEach(function (mesh, index) {
      // Skin sections get separate bounds along their length. Teeth and trim still contribute to the solid.
      mesh.updateMatrix();
      var g = mesh.geometry, attr = g.attributes.position, count = g.index ? g.index.count : attr.count;
      g.computeBoundingBox();
      var size = g.boundingBox.getSize(new THREE.Vector3()), axis = size.x > size.z ? 'x' : 'z';
      var splits = index === 0 ? Math.max(1, Math.ceil(size[axis] / 0.8)) : 1;
      var bounds = Array.from({ length: splits }, function () { return new THREE.Box3(); });
      var v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
      for (var k = 0; k < count; k += 3) {
        for (var j = 0; j < 3; j++) v[j].fromBufferAttribute(attr, g.index ? g.index.getX(k + j) : k + j);
        var centroid = (v[0][axis] + v[1][axis] + v[2][axis]) / 3;
        var i = Math.min(splits - 1, Math.max(0, Math.floor((centroid - g.boundingBox.min[axis]) / (size[axis] || 1) * splits)));
        v.forEach(function (point) { bounds[i].expandByPoint(point.applyMatrix4(mesh.matrix)); });
      }
      // Small features cannot cause a snag independent of their enclosing bone during a sweep.
      if (index > 0) {
        var trim = shapes.find(function (shape) { return shape.bone === bone && shape.trim; });
        if (!trim) { trim = { bone: bone, box: new THREE.Box3(), trim: true }; shapes.push(trim); }
        trim.box.union(bounds[0]);
      } else bounds.forEach(function (b) { if (!b.isEmpty()) shapes.push({ bone: bone, box: b }); });
    });
  });

  function blocked(detail, only) {
    root.updateMatrixWorld(true);
    var solids = only ? [only] : obstacles();
    for (var i = 0; i < shapes.length; i++) {
      var s = shapes[i], m = s.bone.matrixWorld.elements;
      s.box.getCenter(center).applyMatrix4(s.bone.matrixWorld);
      s.box.getSize(half).multiplyScalar(0.5);
      scratch.set(
        Math.abs(m[0]) * half.x + Math.abs(m[4]) * half.y + Math.abs(m[8]) * half.z,
        Math.abs(m[1]) * half.x + Math.abs(m[5]) * half.y + Math.abs(m[9]) * half.z,
        Math.abs(m[2]) * half.x + Math.abs(m[6]) * half.y + Math.abs(m[10]) * half.z
      );
      world.min.copy(center).sub(scratch); world.max.copy(center).add(scratch);
      if (!only && (world.min.x < tank.x1 + 0.27 || world.max.x > tank.x2 - 0.27 ||
          world.min.z < tank.z1 + 0.27 || world.max.z > tank.z2 - 0.27 ||
          world.min.y < tank.floor + 0.34)) return detail ? {kind: "tank", part:i, min:world.min.toArray(), max:world.max.toArray()} : true;
      for (var k = 0; k < solids.length; k++) {
        var b = solids[k];
        if (world.max.x > b.x1 && world.min.x < b.x2 && world.max.y > b.y1 && world.min.y < b.y2 &&
            world.max.z > b.z1 && world.min.z < b.z2) return detail ? {kind:"solid", part:i, obstacle:k, box:b, min:world.min.toArray(), max:world.max.toArray()} : true;
      }
    }
    return false;
  }
  function pose() {
    return { p: root.position.clone(), q: joints.map(function (j) { return j.quaternion.clone(); }) };
  }
  function blend(from, to, k) {
    root.position.lerpVectors(from.p, to.p, k);
    joints.forEach(function (joint, index) { joint.quaternion.copy(from.q[index]).slerp(to.q[index], k); });
  }
  function slide(target, dt) {
    // Try independent movement axes at contact, then submerge a little to pass beneath a hull or rail.
    var old = safe, next = { p: old.p.clone(), q: old.q.slice() }, gap = 4.4 * dt * 0.7;
    ['y', 'x', 'z'].forEach(function (axis) {
      var value = next.p[axis];
      next.p[axis] += Math.max(-gap, Math.min(gap, target.p[axis] - value));
      blend(old, next, 1);
      if (blocked()) next.p[axis] = value;
    });
    if (old.p.distanceToSquared(next.p) < 0.00001 && safe.p.y > 1.32) {
      next.p.y = Math.max(1.32, old.p.y - 1.25 * dt);
      blend(old, next, 1);
      if (blocked()) next.p.y = old.p.y;
    }
    blend(old, next, 1);
    // A tail or neck joint can fold clear even if the main thrust was pinned.
    for (var i = 0; i < joints.length; i++) {
      var q = old.q[i], a = q.angleTo(target.q[i]);
      if (a < 0.0001) continue;
      next.q[i] = q.clone().slerp(target.q[i], Math.min(1, (i ? 2.9 : 1.3) * dt / a));
      joints[i].quaternion.copy(next.q[i]);
      if (blocked()) { next.q[i] = q; joints[i].quaternion.copy(q); }
    }
    safe = next;
  }
  function accept(dt) {
    var target = pose();
    if (!safe) {
      if (blocked()) return false;
      safe = target;
      return true;
    }
    var distance = safe.p.distanceTo(target.p), fraction = Math.min(1, 5.2 * dt / Math.max(distance, 1e-8));
    var angle = 0;
    safe.q.forEach(function (q, i) {
      var a = q.angleTo(target.q[i]);
      angle = Math.max(angle, a);
      fraction = Math.min(fraction, (i === 0 ? 2.3 : 4.8) * dt / Math.max(a, 1e-8));
    });
    var steps = Math.max(1, Math.ceil(fraction * Math.max(distance / 0.065, angle / 0.045)));
    var last = 0;
    for (var i = 1; i <= steps; i++) {
      var t = fraction * i / steps;
      blend(safe, target, t);
      if (blocked()) {
        // Resolve up to the surface. A movement tangent to the obstacle can continue on the next step.
        var lo = last, hi = t;
        for (var k = 0; k < 4; k++) {
          var mid = (lo + hi) / 2;
          blend(safe, target, mid);
          if (blocked()) hi = mid; else lo = mid;
        }
        blend(safe, target, lo);
        safe = pose();
        if (lo < fraction * 0.2 && dt > 0) slide(target, dt * (1 - lo / Math.max(1e-8, fraction)));
        return false;
      }
      last = t;
    }
    safe = pose();
    return true;
  }
  return { accept: accept, blocked: blocked, hits: function (box) { return blocked(false, box); }, pose: pose, blend: blend, reset: function () { safe = null; } };
}
