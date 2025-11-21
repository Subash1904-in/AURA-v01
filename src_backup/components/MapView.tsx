import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapNode, FloorPlan } from '../types';

// --- HELPER FUNCTIONS ---
const pointsToString = (points: {x: number, y: number}[]) => {
    return points.map(p => `${p.x},${p.y}`).join(' ');
};

const calculatePathLength = (path: MapNode[]) => {
    let length = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const nodeA = path[i];
        const nodeB = path[i+1];
        if (nodeA.floor === nodeB.floor) {
             length += Math.sqrt(Math.pow(nodeB.coordinates.x - nodeA.coordinates.x, 2) + Math.pow(nodeB.coordinates.y - nodeA.coordinates.y, 2));
        }
    }
    return length;
}

const findTurns = (path: MapNode[]): { point: {x: number, y: number}, nextPoint: {x: number, y: number} }[] => {
  const turns = [];
  if (path.length < 3) return turns;
  for (let i = 1; i < path.length - 1; i++) {
    const p1 = path[i - 1].coordinates;
    const p2 = path[i].coordinates;
    const p3 = path[i + 1].coordinates;
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const mag1 = Math.sqrt(v1.x*v1.x + v1.y*v1.y);
    const mag2 = Math.sqrt(v2.x*v2.x + v2.y*v2.y);

    if(mag1 === 0 || mag2 === 0) continue;
    
    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const angleRad = Math.acos(dotProduct / (mag1 * mag2));
    const angleDeg = angleRad * 180 / Math.PI;

    if (angleDeg > 25) { // Threshold for a "turn" is 25 degrees
      turns.push({ point: p2, nextPoint: p3 });
    }
  }
  return turns;
};

// --- ICON COMPONENTS ---
const BackIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);

const StartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-2a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" clipRule="evenodd" />
  </svg>
);

const EndIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M9.69 18.233c.256.448.78.717 1.28.665a13.34 13.34 0 0 0 7.422-2.355c.343-.242.533-.66.533-1.096v-3.32c0-.395-.158-.778-.44-1.058l-3.56-3.561a.75.75 0 1 0-1.06 1.06l2.332 2.332-2.31 2.31a.75.75 0 0 0 1.06 1.06l3.562-3.56c.282-.28.44-.663.44-1.058V9.25a.75.75 0 0 0-1.5 0v2.548l-2.31-2.31a.75.75 0 0 0-1.06 1.06l3.56 3.56a.75.75 0 0 1 0 1.06l-3.56 3.561a.75.75 0 0 0 1.06 1.06l2.332-2.332 2.31 2.31c.282.28.44.663.44 1.058v3.32c0 .436-.19.854-.534 1.096a14.84 14.84 0 0 1-8.307 2.628.75.75 0 0 1-.665-1.28Z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-2a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" clipRule="evenodd" />
  </svg>
);

const LiftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M7 2H17V12H7V2M11 5L8 8H10V10H14V8H16L13 5H11M17 14H7V22H17V14M11 16L8 19H10V21H14V19H16L13 16H11Z" />
    </svg>
);

const StairsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M15,5V9H11V13H7V17H3V21H7V17H11V13H15V9H19V5H15Z" />
    </svg>
);

// --- VISUAL ENHANCEMENT COMPONENTS ---
const PulsatingMarker: React.FC<{ cx: number; cy: number; color: string }> = ({ cx, cy, color }) => (
  <g>
    <circle cx={cx} cy={cy} r="8" fill={color} opacity="0.75" />
    <circle cx={cx} cy={cy} r="8" fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.5">
      <animate attributeName="r" from="8" to="25" dur="1.8s" begin="0s" repeatCount="indefinite" />
      <animate attributeName="stroke-opacity" from="0.7" to="0" dur="1.8s" begin="0s" repeatCount="indefinite" />
    </circle>
  </g>
);

const TurnArrow: React.FC<{ point: {x:number, y:number}; nextPoint: {x:number, y:number} }> = ({ point, nextPoint }) => {
  const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;
  return (
    <g transform={`translate(${point.x} ${point.y}) rotate(${angle})`}>
      <path d="M 0 -8 L 15 0 L 0 8 z" fill="#1e40af" fillOpacity="0.8">
          <animate 
              attributeName="fill-opacity"
              values="0.3;1;0.3"
              dur="2.5s"
              repeatCount="indefinite"
          />
      </path>
    </g>
  );
};

// --- Navigation Panel ---
const NavigationPanel: React.FC<{start: string, destination: string, onClose: () => void}> = ({start, destination, onClose}) => {
    return (
        <div className="absolute top-4 left-4 bg-white text-gray-800 rounded-lg shadow-xl w-80 p-4 space-y-3">
            <div className="flex items-center gap-4">
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 bouncy-button"><BackIcon className="w-6 h-6"/></button>
                <h3 className="text-lg font-semibold">Your Route</h3>
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                    <StartIcon className="w-5 h-5 text-gray-400"/>
                    <span>{start}</span>
                </div>
                 <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                    <EndIcon className="w-5 h-5 text-red-500"/>
                    <span className="font-bold">{destination}</span>
                </div>
            </div>
        </div>
    )
}

// --- Floor Transition Overlay ---
const FloorTransitionOverlay: React.FC<{ message: string; type: 'stairs' | 'lift' | 'unknown' }> = ({ message, type }) => {
    const Icon = type === 'lift' ? LiftIcon : StairsIcon;
    return (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-[100] animate-bounce-in text-white">
            <Icon className="w-24 h-24 mb-6" />
            <p className="text-3xl font-semibold text-center">{message}</p>
        </div>
    );
};


// --- MAIN MAPVIEW COMPONENT ---
interface MapViewProps {
  path: MapNode[];
  floorPlans: Record<string, FloorPlan>;
  nodes: Record<string, MapNode>;
  onClose: () => void;
}

const MapView: React.FC<MapViewProps> = ({ path, floorPlans, onClose }) => {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionInfo, setTransitionInfo] = useState<{ message: string; type: 'stairs' | 'lift' | 'unknown' } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  
  const startNode = path[0];
  const endNode = path[path.length - 1];

  const pathSegments = useMemo(() => {
    if (!path || path.length < 2) return path.length === 1 ? [path] : [];
    
    const segments: MapNode[][] = [];
    let currentSegment: MapNode[] = [path[0]];
    
    for (let i = 1; i < path.length; i++) {
        if (path[i].floor !== path[i-1].floor) {
            segments.push([...currentSegment]);
            currentSegment = [];
        }
        currentSegment.push(path[i]);
    }
    segments.push(currentSegment);
    return segments;
  }, [path]);

  const currentSegment = pathSegments[currentSegmentIndex];
  const currentFloorId = currentSegment?.[0]?.floor;
  const currentFloorPlan = floorPlans[currentFloorId];

  const pathData = useMemo(() => {
    if (!currentSegment || currentSegment.length < 2) return '';
    return currentSegment.map((node, index) => {
        const command = index === 0 ? 'M' : 'L';
        return `${command} ${node.coordinates.x},${node.coordinates.y}`;
    }).join(' ');
  }, [currentSegment]);

  const animationDuration = useMemo(() => {
      const length = calculatePathLength(currentSegment || []);
      const PIXELS_PER_SECOND = 150;
      return Math.max(1, length / PIXELS_PER_SECOND);
  }, [currentSegment]);
  
  const turnsOnCurrentSegment = useMemo(() => findTurns(currentSegment || []), [currentSegment]);
  const poisOnCurrentFloor = useMemo(() => {
    return path.filter(node => 
        node.floor === currentFloorId && 
        (node.type === 'lift' || node.type === 'stairs')
    );
  }, [path, currentFloorId]);


  useEffect(() => {
    // Ensure every new path starts animating from its first segment.
    setCurrentSegmentIndex(0);
    setIsTransitioning(false);
    setTransitionInfo(null);
  }, [path]);


  useEffect(() => {
    if (currentSegmentIndex < pathSegments.length - 1) {
        const timer = setTimeout(() => {
            const currentFloor = pathSegments[currentSegmentIndex][0].floor;
            const nextFloor = pathSegments[currentSegmentIndex + 1][0].floor;

            if (currentFloor !== nextFloor) {
                // Find the node that connects the floors (last node of the current segment)
                const transitionNode = path[path.indexOf(pathSegments[currentSegmentIndex][pathSegments[currentSegmentIndex].length - 1])];
                const transitionType = transitionNode.type.includes('stairs') ? 'stairs' : (transitionNode.type.includes('lift') ? 'lift' : 'unknown');
                const nextFloorName = floorPlans[nextFloor]?.name || 'the next floor';
                const message = `Take the ${transitionType} to ${nextFloorName}`;

                setTransitionInfo({ message, type: transitionType });
                setIsTransitioning(true);

                const transitionDisplayTimer = setTimeout(() => {
                    setCurrentSegmentIndex(prev => prev + 1);
                    setIsTransitioning(false);
                    setTransitionInfo(null);
                }, 3000); // Display transition message for 3 seconds

                return () => clearTimeout(transitionDisplayTimer);
            } else {
                setCurrentSegmentIndex(prev => prev + 1);
            }
        }, (animationDuration + 1) * 1000); // Wait for path animation to finish + 1s buffer

        return () => clearTimeout(timer);
    }
}, [currentSegmentIndex, pathSegments, animationDuration, floorPlans, path]);


  if (!currentFloorPlan) return null;
  
  return (
    <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center z-50 p-4 animate-bounce-in overflow-hidden">
        {isTransitioning && transitionInfo && (
            <FloorTransitionOverlay message={transitionInfo.message} type={transitionInfo.type} />
        )}

        <div className={`relative w-full h-full transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <svg
                ref={svgRef}
                viewBox={currentFloorPlan.viewBox}
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <g>
                    {/* Render Floor Plan Geometry from mapData */}
                    {currentFloorPlan.geometry.map(el => (
                        <polygon
                            key={el.id}
                            points={pointsToString(el.points)}
                            fill={el.color?.top || '#f9fafb'}
                            stroke={el.color?.stroke || '#e5e7eb'}
                            strokeWidth="0.5"
                        />
                    ))}
                    {/* Render Labels for geometry */}
                    {currentFloorPlan.geometry.map(el => {
                        if (!el.label) return null;
                        const x = el.points.reduce((sum, p) => sum + p.x, 0) / el.points.length;
                        const y = el.points.reduce((sum, p) => sum + p.y, 0) / el.points.length;
                        const labelLines = el.label.split('\n');
                        
                        return (
                            <text
                                key={`${el.id}-label`}
                                x={x}
                                y={y}
                                fontSize="12"
                                textAnchor="middle"
                                fill="#374151"
                                className="font-sans font-semibold pointer-events-none"
                                style={{ dominantBaseline: 'central' }}
                            >
                              {labelLines.map((line, i) => (
                                <tspan key={i} x={x} dy={i === 0 ? 0 : "1.2em"}>{line}</tspan>
                              ))}
                            </text>
                        );
                    })}
                    
                    {/* Render Highlight for Destination */}
                    {currentFloorPlan.geometry.map(el => {
                        const isDestination = el.nodeId === endNode.id && endNode.floor === currentFloorId;
                        if (isDestination) {
                             return (
                              <polygon 
                                key={el.id} 
                                points={pointsToString(el.points)} 
                                fill="#ef4444"
                                fillOpacity="0.4"
                                stroke="#ef4444"
                                strokeOpacity="0.8"
                                strokeWidth="2" 
                              />
                            );
                        }
                        return null;
                    })}


                    {/* Render Path and Traveler Dot */}
                    {pathData && (
                        <g>
                            {/* Layer 1: Dark, wide outline for contrast on all backgrounds */}
                            <path d={pathData} fill="none" stroke="#1e293b" strokeOpacity="0.6" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                            {/* Layer 2: Main, animated path color */}
                            <path 
                              d={pathData} 
                              fill="none" 
                              stroke="#60a5fa" 
                              strokeWidth="4" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeDasharray="10 5"
                            >
                                <animate 
                                    attributeName="stroke-dashoffset"
                                    from="0" to="15"
                                    dur="0.5s"
                                    repeatCount="indefinite"
                                />
                            </path>
                            <g>
                                <circle r="6" fill="#2563eb" stroke="white" strokeWidth="1.5">
                                    <animateMotion dur={`${animationDuration}s`} fill="freeze" repeatCount="1" path={pathData} />
                                </circle>
                            </g>
                        </g>
                    )}

                     {/* Render start/end markers */}
                    {startNode.floor === currentFloorId && (
                        <circle cx={startNode.coordinates.x} cy={startNode.coordinates.y} r="15" fill="#22c55e" stroke="white" strokeWidth="3" />
                    )}
                    {endNode.floor === currentFloorId && (
                        <g>
                          <PulsatingMarker cx={endNode.coordinates.x} cy={endNode.coordinates.y} color="#ef4444" />
                          <path 
                              transform={`translate(${endNode.coordinates.x}, ${endNode.coordinates.y}) translate(-12, -24) scale(1.2)`}
                              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5-2.5-1.12 2.5-2.5 2.5z" 
                              fill="#ef4444" 
                              stroke="white" 
                              strokeWidth="1.5"
                          />
                        </g>
                    )}
                    {/* Render POI Markers */}
                    {poisOnCurrentFloor.map(poi => (
                        <PulsatingMarker key={poi.id} cx={poi.coordinates.x} cy={poi.coordinates.y} color="#fb923c" />
                    ))}

                    {/* Render Turn Arrows */}
                    {turnsOnCurrentSegment.map((turn, index) => (
                      <TurnArrow key={index} point={turn.point} nextPoint={turn.nextPoint} />
                    ))}
                </g>
            </svg>
            
            {/* Map UI */}
            <NavigationPanel start={startNode.name} destination={endNode.name} onClose={onClose} />
            
        </div>
    </div>
  );
};

export default MapView;