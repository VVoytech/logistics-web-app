import {
    Button,
    Card,
    Container,
    Divider,
    Menu,
    Table,
    TextInput,
    ActionIcon,
    Group,
    Title,
    NumberInput,
} from "@mantine/core";
import {
    IconCategory2,
    IconHome,
    IconSchema,
    IconTrash,
    IconColumnInsertRight,
    IconRowInsertBottom,
    IconDeviceFloppy
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface CustomerData {
    name: string;
    demand: number;
    sellingPrice: number;
}

interface SupplierData {
    id: number;
    name: string;
    supply: number;
    purchasePrice: number;
    transportCosts: Record<string, number>;
}

interface TransportProblemData {
    suppliers: SupplierData[];
    customers: CustomerData[];
}

export const IntermediaryForm = () => {
    const navigate = useNavigate();

    // Inicjalizacja danych
    const [data, setData] = useState<TransportProblemData>({
        suppliers: [
            {
                id: 1,
                name: "Dostawca 1",
                supply: 0,
                purchasePrice: 7,
                transportCosts: {
                    "Odbiorca 1": 0,
                    "Odbiorca 2": 0
                }
            },
            {
                id: 2,
                name: "Dostawca 2",
                supply: 0,
                purchasePrice: 0,
                transportCosts: {
                    "Odbiorca 1": 0,
                    "Odbiorca 2": 0
                }
            }
        ],
        customers: [
            {
                name: "Odbiorca 1",
                demand: 0,
                sellingPrice: 0
            },
            {
                name: "Odbiorca 2",
                demand: 0,
                sellingPrice: 0
            }
        ]
    });

    const handleHome = () => navigate("/");
    const handlePost = () => navigate("/cpmpost");
    const handlePre = () => navigate("/cpmpre");

    // Dodawanie nowego dostawcy
    const addSupplier = () => {
        const newId = Math.max(...data.suppliers.map(s => s.id), 0) + 1;
        const newSupplier: SupplierData = {
            id: newId,
            name: `Dostawca ${newId}`,
            supply: 0,
            purchasePrice: 0,
            transportCosts: data.customers.reduce((acc, customer) => {
                acc[customer.name] = 0;
                return acc;
            }, {} as Record<string, number>)
        };

        setData({
            ...data,
            suppliers: [...data.suppliers, newSupplier]
        });
    };

    // Usuwanie dostawcy
    const removeSupplier = (id: number) => {
        if (data.suppliers.length <= 1) return;
        setData({
            ...data,
            suppliers: data.suppliers.filter(s => s.id !== id)
        });
    };

    // Dodawanie nowego odbiorcy
    const addCustomer = () => {
        const newCustomer: CustomerData = {
            name: `Odbiorca ${data.customers.length + 1}`,
            demand: 0,
            sellingPrice: 0
        };

        setData({
            customers: [...data.customers, newCustomer],
            suppliers: data.suppliers.map(supplier => ({
                ...supplier,
                transportCosts: {
                    ...supplier.transportCosts,
                    [newCustomer.name]: 0
                }
            }))
        });
    };

    // Usuwanie odbiorcy
    const removeCustomer = (name: string) => {
        if (data.customers.length <= 1) return;

        setData({
            customers: data.customers.filter(c => c.name !== name),
            suppliers: data.suppliers.map(supplier => {
                const newTransportCosts = { ...supplier.transportCosts };
                delete newTransportCosts[name];
                return {
                    ...supplier,
                    transportCosts: newTransportCosts
                };
            })
        });
    };

    // Aktualizacja danych dostawcy
    const updateSupplier = (id: number, field: keyof SupplierData, value: string | number) => {
        setData({
            ...data,
            suppliers: data.suppliers.map(supplier =>
                supplier.id === id ? { ...supplier, [field]: value } : supplier
            )
        });
    };

    // Aktualizacja danych odbiorcy
    const updateCustomer = (index: number, field: keyof CustomerData, value: string | number) => {
        const newCustomers = [...data.customers];
        newCustomers[index] = { ...newCustomers[index], [field]: value };

        setData({
            ...data,
            customers: newCustomers
        });
    };

    // Aktualizacja kosztów transportu
    const updateTransportCost = (supplierId: number, customerName: string, value: number) => {
        setData({
            ...data,
            suppliers: data.suppliers.map(supplier => {
                if (supplier.id === supplierId) {
                    return {
                        ...supplier,
                        transportCosts: {
                            ...supplier.transportCosts,
                            [customerName]: value
                        }
                    };
                }
                return supplier;
            })
        });
    };

    // Funkcja do rozwiązania problemu transportowego
    const solveTransportProblem = () => {
        console.log("Rozwiązuję problem transportowy:", data);

    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2vw", padding: "2vw" }}>
            <div style={{ display: "flex", gap: "2vw", width: "100%" }}>
                <Card
                    shadow="md"
                    style={{
                        width: "60vw",
                        height: "80vh",
                        overflowY: "auto",
                        padding: "20px",
                        borderRadius: "12px",
                        backgroundColor: "#f9f9f9",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <Container>
                        <Menu shadow="md" width={200}>
                            <Menu.Target>
                                <Button leftSection={<IconCategory2 />}>MENU</Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Item leftSection={<IconHome size={18} />} onClick={handleHome}>
                                    Strona główna
                                </Menu.Item>
                                <Menu.Item leftSection={<IconSchema size={18} />} onClick={handlePost}>
                                    CPM następnik
                                </Menu.Item>
                                <Menu.Item leftSection={<IconSchema size={18} />} onClick={handlePre}>
                                    CPM poprzednik
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>

                        <Divider my="md" />

                        <Title order={4} mb="md">Problem transportowy</Title>

                        <Group mb="md">
                            <Button leftSection={<IconRowInsertBottom size={18} />} onClick={addSupplier} variant="outline">
                                Dodaj dostawcę
                            </Button>
                            <Button leftSection={<IconColumnInsertRight size={18} />} onClick={addCustomer} variant="outline">
                                Dodaj odbiorcę
                            </Button>
                            <Button leftSection={<IconDeviceFloppy size={18} />} onClick={solveTransportProblem} variant="filled" color="blue">
                                Rozwiąż
                            </Button>
                        </Group>

                        <Table striped highlightOnHover withTableBorder withColumnBorders>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Dostawcy \ Odbiorcy</Table.Th>
                                    {data.customers.map((customer, index) => (
                                        <Table.Th key={index}>
                                            <Group gap="xs" align="flex-end">
                                                <TextInput
                                                    value={customer.name}
                                                    onChange={(e) => updateCustomer(index, 'name', e.target.value)}
                                                    variant="unstyled"
                                                    size="xs"
                                                />
                                                {data.customers.length > 1 && (
                                                    <ActionIcon color="red" size="sm" onClick={() => removeCustomer(customer.name)}>
                                                        <IconTrash size={14} />
                                                    </ActionIcon>
                                                )}
                                            </Group>
                                            <NumberInput
                                                label="Popyt"
                                                value={customer.demand}
                                                onChange={(value) => updateCustomer(index, 'demand', Number(value))}
                                                min={0}
                                                size="xs"
                                            />
                                            <NumberInput
                                                label="Cena sprzedaży"
                                                value={customer.sellingPrice}
                                                onChange={(value) => updateCustomer(index, 'sellingPrice', Number(value))}
                                                min={0}
                                                size="xs"
                                            />
                                        </Table.Th>
                                    ))}
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {data.suppliers.map((supplier) => (
                                    <Table.Tr key={supplier.id}>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <TextInput
                                                    value={supplier.name}
                                                    onChange={(e) => updateSupplier(supplier.id, 'name', e.target.value)}
                                                    variant="unstyled"
                                                    size="xs"
                                                />
                                                {data.suppliers.length > 1 && (
                                                    <ActionIcon color="red" size="sm" onClick={() => removeSupplier(supplier.id)}>
                                                        <IconTrash size={14} />
                                                    </ActionIcon>
                                                )}
                                            </Group>
                                            <NumberInput
                                                label="Podaż"
                                                value={supplier.supply}
                                                onChange={(value) => updateSupplier(supplier.id, 'supply', Number(value))}
                                                min={0}
                                                size="xs"
                                            />
                                            <NumberInput
                                                label="Cena kupna"
                                                value={supplier.purchasePrice}
                                                onChange={(value) => updateSupplier(supplier.id, 'purchasePrice', Number(value))}
                                                min={0}
                                                size="xs"
                                            />
                                        </Table.Td>
                                        {data.customers.map((customer) => (
                                            <Table.Td key={customer.name}>
                                                <NumberInput
                                                    value={supplier.transportCosts[customer.name] || 0}
                                                    onChange={(value) => updateTransportCost(supplier.id, customer.name, Number(value))}
                                                    min={0}
                                                    hideControls
                                                    variant="unstyled"
                                                />
                                            </Table.Td>
                                        ))}

                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Container>
                </Card>
            </div>
        </div>
    );
};