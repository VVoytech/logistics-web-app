import * as go from 'gojs';
import { useEffect, useRef } from 'react';

// Typowanie dla elementu div z diagramem
interface DiagramDivElement extends HTMLDivElement {
    diagram?: go.Diagram;
}

interface GraphData {
    nodes: { key: number; }[]; // Węzły z kluczem jako numer
    links: { from: number; to: number; label: string; duration: number }[]; // Połączenia z nazwą czynności i czasem trwania
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
                    layout: $(go.LayeredDigraphLayout, { direction: 0 }), // Rozkład od lewej do prawej
                    padding: 20
                });

                // Konfiguracja węzłów
                diagram.nodeTemplate =
                    $(go.Node, "Auto",
                        $(go.Shape, "Circle", { fill: "lightblue", stroke: "black", width: 100, height: 100 }),
                        $(go.TextBlock, { margin: 5, font: "bold 12pt sans-serif" }, new go.Binding("text", "key"))
                    );

                // Konfiguracja połączeń między węzłami
                diagram.linkTemplate =
                    $(go.Link,
                        { routing: go.Link.AvoidsNodes, corner: 10,}, // Lepsza czytelność linii
                        $(go.Shape, { strokeWidth: 2, stroke: "black" }),
                        $(go.Shape, { toArrow: "OpenTriangle", stroke: "black", fill: "black" }),
                        $(go.TextBlock, { segmentOffset: new go.Point(0, -15), font: "10pt sans-serif" }, new go.Binding("text", "label")),
                        $(go.TextBlock, { segmentOffset: new go.Point(0, 15), font: "10pt sans-serif" }, new go.Binding("text", "duration"))
                    );

                diagramRef.current.diagram = diagram;
            }

            // Ustawienie modelu diagramu
            diagram.model = new go.GraphLinksModel(data.nodes, data.links);
        }
    }, [data]);

    return <div ref={diagramRef} style={{ width: "100%", height: "100%", backgroundColor: "#f0f0f0" }} />;
};

export default GraphComponent;