// Specimens face local +X. Each articulated model uses one instanced draw.
// A unit sphere between two joints forms a tapered limb or shell rib.
var MarineGallery = (function () {
  var sphere, skin;
  function specimen(parent, kind, habitat, updates) {
    if (!sphere) {
      sphere = new THREE.SphereGeometry(1, 16, 10);
      // Dapple the skin and shell with a fine grain under the gallery tubes.
      var points = sphere.attributes.position, tones = [];
      for (var v = 0; v < points.count; v++) {
        var grain = 0.90 + 0.045 * Math.sin(points.getX(v)*23 + points.getZ(v)*11)
          + 0.035 * Math.cos(points.getY(v)*19 - points.getX(v)*13);
        tones.push(grain,grain,grain);
      }
      sphere.setAttribute('color',new THREE.Float32BufferAttribute(tones,3));
    }
    skin = skin || new THREE.MeshStandardMaterial({ roughness: 0.59, metalness: 0.08, vertexColors: true });
    var pieces = [], strokes = [], clock = habitat.phase || 0;
    var shell = 0xa3704d, ridge = 0xd1a16b, olive = 0x746f48, pale = 0xddd4ae, dark = 0x171e20;
    function oval(x,y,z,a,b,c,color,tilt) {
      var p = new THREE.Object3D();
      p.position.set(x,y,z); p.scale.set(a,b,c); p.rotation.z = tilt || 0;
      pieces.push({ pose:p, color:color }); return p;
    }
    function limb(x,y,z,dx,dy,dz,r,color) {
      var v = new THREE.Vector3(dx,dy,dz);
      var p = oval(x+dx/2,y+dy/2,z+dz/2,r,v.length()/2+r*0.45,r,color);
      p.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()); return p;
    }
    function stroke(p,axis,amp,phase,rate) {
      var rest = p.rotation[axis];
      strokes.push(function(t){ p.rotation[axis] = rest + amp*Math.sin(t*rate+phase); });
    }
    function eyes(x,y,z,size) {
      [-1,1].forEach(function(s){ oval(x,y,s*z,size,size,size*0.8,dark); });
    }
    var i, s, f;
    if (kind === 'TRILOBITE' || kind === 'HORSESHOE CRAB') {
      var crab = kind === 'HORSESHOE CRAB';
      oval(0.20,0,0,0.30,0.15,0.31,crab ? olive : shell);
      oval(-0.13,-0.023,0,0.34,0.10,0.22,olive);
      for(i=0;i<10;i++){
        f=1-i/13;
        oval(0.06-i*0.049,0,0,0.044,f*0.12,f*0.28,crab ? olive : ridge);
        if(!crab) oval(0.06-i*0.049,0.075*f,0,0.046,0.071*f,0.09*f,shell);
        for(s=-1;s<=1;s+=2) stroke(limb(0.19-i*0.039,-0.05,s*0.12,-0.08,-0.055,s*0.14*f,0.015,olive),'y',0.20,i*0.65,4);
      }
      eyes(0.26,0.108,0.16,0.037);
      if(crab) limb(-0.40,0,0,-0.53,-0.035,0,0.035,olive);
      else for(s=-1;s<=1;s+=2) limb(0.4,0,s*0.14,0.25,-0.035,s*0.10,0.014,ridge);
    } else if(kind === 'AMMONITE' || kind === 'NAUTILUS'){
      var ammonite=kind === 'AMMONITE';
      oval(0,0,0,0.35,0.35,0.16,ammonite ? shell : pale);
      // Raised whorls on both faces; ribs follow the shell as it expands.
      for(s=-1;s<=1;s+=2) for(i=0;i<80;i++){
        var ang=i*0.15, radius=0.023*Math.exp(ang*0.224);
        var z=s*(0.16*Math.sqrt(Math.max(0,1-radius*radius/0.125))+0.006);
        oval(radius*Math.cos(ang),radius*Math.sin(ang),z,0.014+radius*0.12,0.012+radius*0.05,0.012,ammonite ? ridge : (i%6<2?shell:pale),ang);
      }
      if (!ammonite) for(i=0;i<14;i++){
        var band=i*Math.PI/7;
        oval(0.308*Math.cos(band),0.308*Math.sin(band),0,0.035,0.092,0.105,0xad6448,band-Math.PI/2);
      }
      oval(0.26,-0.17,0,0.20,0.12,0.13,pale); eyes(0.35,-0.14,0.108,0.032);
      for(i=0;i<16;i++){
        var a=i*Math.PI/8;
        stroke(limb(0.34,-0.19+0.06*Math.cos(a),0.08*Math.sin(a),0.18+0.07*Math.cos(i),-0.09+0.08*Math.cos(a),0.12*Math.sin(a),0.014,pale),'z',0.13,i*0.5,2.6);
      }
    } else if(kind === 'OPABINIA' || kind === 'ANOMALOCARIS'){
      var op=kind === 'OPABINIA', pigment=op ? 0x888957 : 0xaf624a;
      for(i=0;i<13;i++){
        f=1-i/16; var x=0.29-i*0.061;
        oval(x,0,0,0.105,f*0.12,f*0.14,pigment);
        for(s=-1;s<=1;s+=2){
          var flap=oval(x-0.04,-0.025,s*0.17*f,0.094*f,0.022,0.19*f,op ? olive : shell);
          flap.rotation.y=s*0.42; stroke(flap,'x',0.32*s,i*0.54,4.5);
        }
      }
      for(i=0;i<(op?5:2);i++){
        var side=op?(i-2)/2:(i?1:-1);
        limb(0.32,0.05,0,0.045,0.10,side*0.18,0.025,pigment);
        oval(0.37,0.15,side*0.18,0.039,0.042,0.036,dark);
      }
      for(s=-1;s<=1;s+=2){
        oval(-0.51,0,s*0.06,0.13,0.02,0.09,pigment).rotation.y=s*0.48;
        if(op) limb(0.61,-0.07,0,0.09,0.05,s*0.034,0.016,ridge);
        else for(i=0;i<7;i++){
          var ax=0.33+i*0.04, ay=-0.02-0.11*Math.sin(i*0.43);
          oval(ax,ay,s*0.10,0.045,0.035,0.034,ridge);
          limb(ax,ay,s*0.10,0.026,-0.073,0,0.012,shell);
        }
      }
      if(op) limb(0.32,0,0,0.32,-0.078,0,0.034,pigment);
    } else {
      var reptile=kind === 'MESOSAURUS', hide=reptile ? 0x697658 : 0x536d78;
      oval(0,0,0,0.41,reptile?0.12:0.21,0.14,hide);
      oval(0.30,0.025,0,0.20,0.11,0.115,hide);
      if(reptile) oval(0.52,0.025,0,0.22,0.044,0.064,olive);
      eyes(0.39,0.075,0.093,0.026);
      for(i=0;i<11;i++){
        f=1-i/13;
        var joint=oval(-0.31-i*0.046,0,0,0.13*f,0.095*f,0.088*f,hide);
        (function(p,n){ strokes.push(function(t){p.position.z=Math.sin(t*3-n*0.24)*0.012*n;}); })(joint,i);
        if(!reptile && i>6) joint.scale.y*=2.7;
      }
      if(!reptile) oval(-0.02,0.18,0,0.14,0.11,0.018,hide,-0.46);
      for(s=-1;s<=1;s+=2) for(i=0;i<2;i++){
        var fin=oval(0.18-i*0.43,-0.075,s*0.16,0.13,0.024,0.11,hide);
        fin.rotation.y=s*0.65; stroke(fin,'x',0.32*s,i*2+s,2.3);
      }
      for(i=0;i<19;i++) for(s=-1;s<=1;s+=2){
        var px=(i%7-3)*0.078, py=0.013+Math.floor(i/7)*0.029;
        oval(px,py,s*0.14*Math.sqrt(Math.max(0,1-px*px/0.168-py*py/(reptile?0.0144:0.0441))),0.016,0.012,0.008,reptile?olive:0xb1b8aa);
      }
    }
    var model=new THREE.InstancedMesh(sphere,skin,pieces.length);
    model.userData.keep=true; model.frustumCulled=false; parent.add(model);
    pieces.forEach(function(piece,n){model.setColorAt(n,new THREE.Color(piece.color));});
    model.scale.setScalar(habitat.scale);
    function update(dt){
      clock+=dt;
      var angle=clock*habitat.speed, crawl=kind==='TRILOBITE'||kind==='HORSESHOE CRAB';
      model.position.set(habitat.x+habitat.rx*Math.sin(angle),habitat.y+(crawl?0:0.025*Math.sin(angle*2.1)),habitat.z+habitat.rz*Math.cos(angle));
      model.rotation.y=Math.atan2(habitat.rz*Math.sin(angle),habitat.rx*Math.cos(angle));
      if(kind==='AMMONITE'||kind==='NAUTILUS') model.rotation.y+=Math.PI;
      strokes.forEach(function(fn){fn(clock);});
      pieces.forEach(function(piece,n){piece.pose.updateMatrix();model.setMatrixAt(n,piece.pose.matrix);});
      model.instanceMatrix.needsUpdate=true;
    }
    update(0); updates.push(update);
  }
  return { specimen:specimen };
})();
