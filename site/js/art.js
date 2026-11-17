import * as T from "https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js";

function orbit() {
  const group=new T.Group();
  const points=[], edges=[];
  for(let i=0;i<210;i++) {
    const y=1-2*(i+.5)/210,a=i*2.3999632,r=Math.sqrt(1-y*y),scale=1.38+.055*Math.sin(i*11.47);
    points.push(new T.Vector3(Math.cos(a)*r*scale,y*scale,Math.sin(a)*r*scale));
  }
  for(let i=0;i<points.length;i++) for(let j=i+1;j<points.length;j++){
    if(points[i].distanceToSquared(points[j])<.143) edges.push(points[i],points[j]);
  }
  group.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(edges),new T.LineBasicMaterial({color:0x48a4a4,transparent:true,opacity:.43})));
  group.add(new T.Points(new T.BufferGeometry().setFromPoints(points),new T.PointsMaterial({color:0xaaffec,size:.037,transparent:true,opacity:.95})));
  const heart=new T.Shape();
  heart.moveTo(0,-.34);
  heart.bezierCurveTo(-.09,-.24,-.46,.02,-.38,.22);
  heart.bezierCurveTo(-.29,.46,-.07,.4,0,.24);
  heart.bezierCurveTo(.08,.4,.29,.46,.38,.22);
  heart.bezierCurveTo(.46,.02,.10,-.24,0,-.34);
  group.add(new T.Mesh(new T.ExtrudeGeometry(heart,{depth:.045,bevelEnabled:true,bevelThickness:.025,bevelSize:.027,bevelSegments:3,curveSegments:24}),new T.MeshBasicMaterial({color:0xd0ffeb})));
  for(let i=0;i<7;i++){
    const halo=new T.Mesh(new T.SphereGeometry(.34+.085*i,18,14),new T.MeshBasicMaterial({color:0x50f0bb,transparent:true,opacity:.047,depthWrite:false,blending:T.AdditiveBlending}));
    group.add(halo);
  }
  const rail=new T.Mesh(new T.TorusGeometry(1.61,.006,6,92),new T.MeshBasicMaterial({color:0xb293ff,transparent:true,opacity:.67}));
  rail.rotation.x=1;rail.rotation.y=-.3;group.add(rail);
  return group;
}
function chart(){
  const group=new T.Group();
  const values=[5,2,2,1],colors=[0x79fcea,0xbf9aff,0x9cb9ff,0xbcf78c];
  let start=Math.PI/2;
  for(const [i,n] of values.entries()){
    const width=Math.PI*2*n/10,end=start+width-.08;
    const wedge=new T.Shape();
    wedge.absarc(0,0,1,start,end,false);
    wedge.lineTo(.68*Math.cos(end),.68*Math.sin(end));
    wedge.absarc(0,0,.68,end,start,true);wedge.closePath();
    group.add(new T.Mesh(new T.ExtrudeGeometry(wedge,{depth:.12,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:1,curveSegments:25}),new T.MeshStandardMaterial({color:colors[i],roughness:.55})));
    start+=width;
  }
  return group;
}
export function mount(targets,{motion,label}) {
  const objects=[];
  let x=0,y=0,raf=0,mobileEnabled=false;
  const visible=new IntersectionObserver(rows=>{
    for(const row of rows){const draw=objects.find(o=>o.root===row.target);if(draw)draw.visible=row.isIntersecting;}
    if(!raf) raf=requestAnimationFrame(frame);
  },{rootMargin:"0px"});
  const resize=new ResizeObserver(rows=>{
    for(const row of rows){
      const item=objects.find(o=>o.root===row.target);
      if(!item)continue;
      const {width,height}=row.contentRect;
      if(width<1||height<1)continue;
      item.renderer.setSize(width,height,false);
      item.camera.aspect=width/height;item.camera.updateProjectionMatrix();
    }
  });
  function frame(ms){
    raf=0;
    if(motion.matches||document.hidden) return;
    let drawn=false;
    for(const {root,renderer,camera,scene,model,visible,hero} of objects){
      if(!visible||renderer.getContext().isContextLost())continue;
      if(hero){
        model.rotation.y=ms*.00014+x*.32;
        model.rotation.x=.13+y*.22;
      }else{
        model.rotation.x=-.27+.12*Math.sin(ms*.0011);model.rotation.y=.19*Math.sin(ms*.001);
        model.rotation.z=ms*.00008;
      }
      renderer.render(scene,camera);
      root.classList.add("enhanced");
      drawn=true;
    }
    if(drawn)raf=requestAnimationFrame(frame);
  }
  const restart=()=>{
    if(motion.matches){for(const {root,renderer} of objects){root.classList.remove("enhanced");renderer.domElement.hidden=true;}return;}
    for(const {renderer} of objects) renderer.domElement.hidden=false;
    if(!raf)raf=requestAnimationFrame(frame);
  };
  motion.addEventListener("change",restart);
  document.addEventListener("visibilitychange",restart);
  for(const root of targets){
    let renderer;
    try{renderer=new T.WebGLRenderer({alpha:true,antialias:false,powerPreference:"low-power"});}catch{continue;}
    const hero=root.dataset.three==="hero";
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.45));
    renderer.domElement.addEventListener("webglcontextlost",event=>{event.preventDefault();root.classList.remove("enhanced");renderer.domElement.hidden=true;});
    renderer.domElement.addEventListener("webglcontextrestored",restart);
    root.append(renderer.domElement);
    const scene=new T.Scene(), model=hero?orbit():chart();
    const camera=new T.PerspectiveCamera(hero?42:36,1,.1,60);
    camera.position.z=hero?4.4:3.9;
    scene.add(model);
    if(!hero){
      scene.add(new T.HemisphereLight(0xf3ffff,0x302b66,2.5));
      const light=new T.DirectionalLight(0xffffff,1.7);light.position.set(2,3,4);scene.add(light);
    }
    objects.push({root,renderer,camera,scene,model,visible:false,hero});
    visible.observe(root);resize.observe(root);
    if(hero){
      const wrap=root.closest(".hero");
      wrap.addEventListener("pointermove",ev=>{
        const rect=wrap.getBoundingClientRect();
        x=((ev.clientX-rect.left)/rect.width-.5)*2;y=((ev.clientY-rect.top)/rect.height-.5)*2;
      },{passive:true});
      wrap.addEventListener("pointerleave",()=>{x=y=0;});
      if(window.DeviceOrientationEvent&&matchMedia("(pointer:coarse)").matches){
        const button=document.createElement("button");button.type="button";button.className="sensor";
        button.textContent=label;button.setAttribute("aria-pressed","false");
        wrap.append(button);
        const tilt=event=>{x=Math.max(-1,Math.min(1,(event.gamma??0)/35));y=Math.max(-1,Math.min(1,(event.beta??0)/60));};
        button.addEventListener("click",async()=>{
          if(mobileEnabled){removeEventListener("deviceorientation",tilt);mobileEnabled=false;x=y=0;}
          else {
            try { if(typeof DeviceOrientationEvent.requestPermission==="function"&&await DeviceOrientationEvent.requestPermission()!=="granted")return; }
            catch{return;}
            addEventListener("deviceorientation",tilt,{passive:true});mobileEnabled=true;
          }
          button.setAttribute("aria-pressed",String(mobileEnabled));
        });
      }
    }
  }
}
