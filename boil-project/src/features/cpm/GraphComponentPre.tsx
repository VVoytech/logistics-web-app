import * as go from 'gojs';
import { useEffect, useRef } from 'react';

interface DiagramDivElement extends HTMLDivElement {
    diagram?: go.Diagram;
}

interface GraphData {
    nodes: { key: number; t0: number; t1: number; L: number, label: string }[];
    links: { from: number; to: number; label: string; duration: number, color: string }[];
}

interface GraphComponentProps {
    data: GraphData;
}

const GraphComponentPre = ({ data }: GraphComponentProps) => {
    const diagramRef = useRef<DiagramDivElement | null>(null);

    useEffect(() => {
        if (diagramRef.current) {
            const $ = go.GraphObject.make;

            let diagram = diagramRef.current.diagram;

            if (!diagram) {
                diagram = $(go.Diagram, diagramRef.current, {
                    "undoManager.isEnabled": true,
                    layout: $(go.LayeredDigraphLayout, { direction: 0 }),
                    padding: 20,
                    "animationManager.isEnabled": false
                });

                diagram.nodeTemplate =
                    $(go.Node, "Auto",
                        $(go.Shape, "Circle", {
                            fill: "lightblue",
                            stroke: "black",
                            width: 140,
                            height: 140
                        }),
                        $(go.Shape, {
                            geometryString: "M 0 0 L 140 140 M 0 140 L 140 0",
                            stroke: "black",
                            strokeWidth: 1
                        }),
                        // Nazwa węzła na górze (używamy label zamiast key)
                        $(go.TextBlock, {
                            alignment: new go.Spot(0.5, 0.5, 0, -40),
                            font: "bold 12pt sans-serif",
                            textAlign: "center",
                            width: 120
                        }, new go.Binding("text", "label")),
                        // Lewa ćwiartka - t0
                        $(go.TextBlock, {
                            alignment: new go.Spot(0.5, 0.5, -30, 0),
                            textAlign: "center",
                            width: 60
                        }, new go.Binding("text", "t0")),
                        // Prawa ćwiartka - t1
                        $(go.TextBlock, {
                            alignment: new go.Spot(0.5, 0.5, 30, 0),
                            textAlign: "center",
                            width: 60
                        }, new go.Binding("text", "t1")),
                        // Dolna ćwiartka - L
                        $(go.TextBlock, {
                            alignment: new go.Spot(0.5, 0.5, 0, 35),
                            textAlign: "center",
                            width: 60
                        }, new go.Binding("text", "L"))
                    );

                diagram.linkTemplate =
                    $(go.Link,
                        { routing: go.Link.AvoidsNodes, corner: 10 },
                        $(go.Shape, { strokeWidth: 2 }, new go.Binding("stroke", "color")),
                        $(go.Shape, { toArrow: "OpenTriangle" }, new go.Binding("stroke", "color"), new go.Binding("fill", "color")),
                        $(go.TextBlock, { segmentOffset: new go.Point(0, 15), font: "10pt sans-serif" }, new go.Binding("text", "duration"))
                    );

                diagramRef.current.diagram = diagram;
            }

            diagram.model = new go.GraphLinksModel(data.nodes, data.links);
        }
    }, [data]);

    return <div ref={diagramRef} style={{ width: "100%", height: "100%", backgroundColor: "#f0f0f0" }} />;
};

export default GraphComponentPre;