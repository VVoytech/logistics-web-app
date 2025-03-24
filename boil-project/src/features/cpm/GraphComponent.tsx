import * as go from 'gojs';
import { useEffect, useRef } from 'react';

interface DiagramDivElement extends HTMLDivElement {
    diagram?: go.Diagram;
}

interface GraphData {
    nodes: { key: number; t0: number; t1: number; L: number }[];
    links: { from: number; to: number; label: string; duration: number, color: string }[];
}

interface GraphComponentProps {
    data: GraphData;
}

const GraphComponent = ({ data }: GraphComponentProps) => {
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

                // Funkcja do dynamicznego ustawiania rozmiaru czcionki
                const setFontSize = (val: string) => {
                    const length = val ? val.toString().length : 0;
                    return length > 2 ? "10pt sans-serif" : "12pt sans-serif";
                };

                diagram.nodeTemplate =
                    $(go.Node, "Auto",
                        $(go.Shape, "Circle", {
                            fill: "lightblue",
                            stroke: "black",
                            width: 140,  // Zwiększone o 20px dla lepszego dopasowania
                            height: 140
                        }),
                        $(go.Shape, {
                            geometryString: "M 0 0 L 140 140 M 0 140 L 140 0",
                            stroke: "black",
                            strokeWidth: 1
                        }),
                        // Nazwa węzła na górze
                        $(go.TextBlock, {
                            alignment: new go.Spot(0.5, 0.5, 0, -40),
                            font: "bold 12pt sans-serif",
                            textAlign: "center",
                            width: 120,
                            //wrap: go.TextBlock.None,
                            //overflow: go.TextBlock.OverflowEllipsis
                        }, new go.Binding("text", "key")),
                        // Lewa ćwiartka - t0
                        $(go.TextBlock, {
                                alignment: new go.Spot(0.5, 0.5, -30, 0),
                                textAlign: "center",
                                width: 60,
                                //wrap: go.TextBlock.None,
                                //overflow: go.TextBlock.OverflowEllipsis
                            },
                            new go.Binding("text", "t0"),
                            new go.Binding("font", "t0", setFontSize)),
                        // Prawa ćwiartka - t1
                        $(go.TextBlock, {
                                alignment: new go.Spot(0.5, 0.5, 30, 0),
                                textAlign: "center",
                                width: 60,
                                //wrap: go.TextBlock.None,
                                //overflow: go.TextBlock.OverflowEllipsis
                            },
                            new go.Binding("text", "t1"),
                            new go.Binding("font", "t1", setFontSize)),
                        // Dolna ćwiartka - L
                        $(go.TextBlock, {
                                alignment: new go.Spot(0.5, 0.5, 0, 35),
                                textAlign: "center",
                                width: 60,
                                //wrap: go.TextBlock.None,
                                //overflow: go.TextBlock.OverflowEllipsis
                            },
                            new go.Binding("text", "L"),
                            new go.Binding("font", "L", setFontSize))
                    );

                diagram.linkTemplate =
                    $(go.Link,
                        { routing: go.Link.AvoidsNodes, corner: 10 },
                        $(go.Shape, { strokeWidth: 2 }, new go.Binding("stroke", "color")),
                        $(go.Shape, { toArrow: "OpenTriangle" }, new go.Binding("stroke", "color"), new go.Binding("fill", "color")),
                        $(go.TextBlock, { segmentOffset: new go.Point(0, -15), font: "10pt sans-serif" }, new go.Binding("text", "label")),
                        $(go.TextBlock, { segmentOffset: new go.Point(0, 15), font: "10pt sans-serif" }, new go.Binding("text", "duration"))
                    );

                diagramRef.current.diagram = diagram;
            }

            diagram.model = new go.GraphLinksModel(data.nodes, data.links);
        }
    }, [data]);

    return <div ref={diagramRef} style={{ width: "100%", height: "800px", backgroundColor: "#f0f0f0" }} />;
};

export default GraphComponent;