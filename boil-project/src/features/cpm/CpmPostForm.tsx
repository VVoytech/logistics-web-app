import { Button, Container, Table, TextInput, NumberInput } from "@mantine/core";
import { useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";

interface Row {
    id: number;
    predecessor: string;
    duration: number;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const CpmPostForm = () => {
    const [rows, setRows] = useState<Row[]>([{ id: 1, predecessor: "", duration: 0 }]);

    const addRow = () => {
        setRows([...rows, { id: rows.length + 1, predecessor: "", duration: 0 }]);
    };

    const removeRow = (id: number) => {
        setRows(rows.filter((row) => row.id !== id));
    };

    const updateRow = (id: number, field: keyof Row, value: string | number | null) => {
        setRows(rows.map((row) =>
            row.id === id ? { ...row, [field]: value ?? 0 } : row
        ));
    };

    return (
        <Container>
            <Table striped highlightOnHover>
                <thead>
                <tr>
                    <th>Czynności</th>
                    <th>Czynność następująca</th>
                    <th>Czas trwania</th>
                    <th>Usuń</th>
                </tr>
                </thead>
                <tbody>
                {rows.map((row, index) => (
                    <tr key={row.id}>
                        <td>{alphabet[index] || "-"}</td> {/* Nazwa automatyczna */}
                        <td>
                            <TextInput
                                value={row.predecessor}
                                onChange={(e) => updateRow(row.id, "predecessor", e.target.value)}
                                placeholder="Poprzednia czynność"
                            />
                        </td>
                        <td>
                            <NumberInput
                                value={row.duration}
                                onChange={(value) => updateRow(row.id, "duration", value)}
                                min={0}
                                step={1}
                                hideControls // ❌ WYŁĄCZAM przyciski "+" i "-"
                                placeholder="Czas"
                            />
                        </td>
                        <td>
                            <Button color="red" onClick={() => removeRow(row.id)} disabled={rows.length === 1}>
                                <IconTrash size={18} />
                            </Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>
            <Button onClick={addRow} leftSection={<IconPlus size={18} />} mt="md">
                Dodaj wiersz
            </Button>
        </Container>
    );
};
