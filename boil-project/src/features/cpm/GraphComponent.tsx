import * as go from 'gojs';
import { useEffect, useRef } from 'react';

interface DiagramDivElement extends HTMLDivElement {
    diagram?: go.Diagram;
}

interface GraphData {
    nodes: { key: number; t0: number; t1: number; L: number }[];
    links: { from: number; to: number; label: string; duration: number,color:string }[];
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
                    padding: 20
                });

                diagram.nodeTemplate =
                    $(go.Node, "Auto",
                        $(go.Shape, "Circle", { fill: "lightblue", stroke: "black", width: 100, height: 100 }),
                        $(go.Panel, "Table",
                            $(go.RowColumnDefinition, { column: 1, width: 80 }),
                            $(go.TextBlock, { row: 0, column: 1, font: "bold 12pt sans-serif" }, new go.Binding("text", "key")),
                            $(go.TextBlock, { row: 1, column: 1, font: "10pt sans-serif" }, new go.Binding("text", "t0", t0 => `t0: ${t0}`)),
                            $(go.TextBlock, { row: 2, column: 1, font: "10pt sans-serif" }, new go.Binding("text", "t1", t1 => `t1: ${t1}`)),
                            $(go.TextBlock, { row: 3, column: 1, font: "10pt sans-serif" }, new go.Binding("text", "L", L => `L: ${L}`))
                        )
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

    return <div ref={diagramRef} style={{ width: "100%", height: "100%", backgroundColor: "#f0f0f0" }} />;
};

export default GraphComponent;
