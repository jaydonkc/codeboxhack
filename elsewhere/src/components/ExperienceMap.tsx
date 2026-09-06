import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Experience } from '../data/catalog';
import { C, s } from '../theme';
export type MapProps = { items:Experience[]; selected:string|null; onSelect:(id:string)=>void };
export default function ExperienceMap({ items, selected, onSelect }:MapProps) {
  const ref=useRef<MapView>(null);
  const points=items.filter(x=>x.lat!==null && x.lng!==null);
  useEffect(()=>{ if(points.length) ref.current?.fitToCoordinates(points.map(x=>({latitude:x.lat!,longitude:x.lng!})), {edgePadding:{top:60,right:45,bottom:60,left:45},animated:true}); }, [items.map(x=>x.id).join(',')]);
  return <View style={{height:380,borderRadius:20,overflow:'hidden',backgroundColor:C.water}}><MapView ref={ref} style={{flex:1}} initialRegion={{latitude:35.287,longitude:-120.668,latitudeDelta:0.07,longitudeDelta:0.07}} userInterfaceStyle="dark">{points.map(x=><Marker key={x.id} coordinate={{latitude:x.lat!,longitude:x.lng!}} title={x.name} pinColor={selected===x.id?C.coral:'#587e3c'} onPress={()=>onSelect(x.id)}/>)}</MapView>{!points.length&&<Text style={[s.muted,{position:'absolute',top:25,left:20,right:20}]}>No verified map positions for these results yet.</Text>}</View>;
}
