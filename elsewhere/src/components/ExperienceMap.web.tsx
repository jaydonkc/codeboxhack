import React, { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { MapProps } from './ExperienceMap';
import 'leaflet/dist/leaflet.css';
export default function ExperienceMap({items,selected,onSelect}:MapProps){
 const host=useRef<HTMLDivElement>(null), map=useRef<LeafletMap|null>(null), onSelectRef=useRef(onSelect);
 onSelectRef.current=onSelect;
 useEffect(()=>{let dead=false; import('leaflet').then(L=>{if(dead||!host.current)return; const m=L.map(host.current,{scrollWheelZoom:false}).setView([35.287,-120.668],13);map.current=m;
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).addTo(m);
 const points=items.filter(x=>x.lat!==null&&x.lng!==null);points.forEach(x=>{const marker=L.circleMarker([x.lat!,x.lng!],{radius:x.id===selected?13:10,fillColor:x.id===selected?'#ffb297':'#345c36',color:'#fff9e9',weight:3,fillOpacity:1}).addTo(m);marker.bindTooltip(x.name);marker.on('click',()=>onSelectRef.current(x.id));const el=marker.getElement();if(el){el.setAttribute('tabindex','0');el.setAttribute('role','button');el.setAttribute('aria-label',x.name);el.addEventListener('keydown',(ev)=>{if((ev as KeyboardEvent).key==='Enter')onSelectRef.current(x.id);});}});
 if(points.length>1)m.fitBounds(points.map(x=>[x.lat!,x.lng!] as [number,number]),{padding:[40,40],maxZoom:14});
 else if(points.length===1)m.setView([points[0].lat!,points[0].lng!],14);
 });return()=>{dead=true;map.current?.remove();map.current=null;};},[items.map(x=>x.id).join(','),selected]);
 return <div ref={host} aria-label="Map of San Luis Obispo experiences" style={{height:380,width:'100%',borderRadius:20,overflow:'hidden',background:'#213f47'}}/>;
}
