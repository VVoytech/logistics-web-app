import {
    Button,
    Container,
    Table,
    TextInput,
    NumberInput,
    Group,
    AppShell,
    useMantineTheme,
    Burger
} from "@mantine/core";
import { useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import {useDisclosure} from "@mantine/hooks";
import logo from '../../assets/logo.png';

interface Row {
    id: number;
    predecessor: string;
    duration: number;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const CpmPreForm = () => {
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

    const theme = useMantineTheme();
    const [opened, { toggle }] = useDisclosure();

    return (
        <AppShell
            padding="md"
            header={{
                height: 60,
            }}
            navbar={{
                width: 300,
                breakpoint: "sm",
                collapsed: { mobile: !opened },
            }}
        >
            <AppShell.Header style={{ backgroundColor: theme.colors.blue[6], color: "white" }}>
                <Group h="100%" px="md" justify="space-between">

                    <img
                        src={logo}
                        alt="Logo"
                        style={{height: 40}}
                    />

                    <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white"/>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md" style={{backgroundColor: theme.colors.gray[0]}}>
                <Container>
                    <Table striped highlightOnHover>
                        <thead>
                        <tr>
                            <th>Czynności</th>
                            <th>Czynność poprzedzająca</th>
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
                                        hideControls
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
            </AppShell.Navbar>

            <AppShell.Main style={{ backgroundColor: theme.colors.gray[1], borderRadius: 8 }}>
                <div>Dupa</div>
            </AppShell.Main>
        </AppShell>
    );
};
