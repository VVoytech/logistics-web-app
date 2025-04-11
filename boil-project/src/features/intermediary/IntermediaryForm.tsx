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
interface TransportSolution {
    allocation: number[][];
    profits: number[][];
    supply: number[];
    demand: number[];
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


    const solveTransportProblem = () => {
        const result = proccesDataForCalculating(data);
        const unitProfitMatrix = unitProfitCalculator(result.transportCostsMatrix, result.purchaseCosts, result.sellingPrices);

        const totalDemand = result.demand.reduce((sum, current) => sum + current, 0);
        const totalSupply = result.supply.reduce((sum, current) => sum + current, 0);

        if (totalDemand !== totalSupply) {
            result.demand.push(totalSupply);
            result.supply.push(totalDemand);

            const newSupplierRow = [0, 0, 0];
            unitProfitMatrix.push(newSupplierRow);
            unitProfitMatrix.forEach(row => {
                row.push(0); // Dodajemy 0 do każdego wiersza
            });
        }

        const potentialPath = calculatePotentialPath(unitProfitMatrix, result.supply, result.demand);

        const solution: TransportSolution = {
            allocation: potentialPath,
            profits: unitProfitMatrix,
            supply: result.supply,
            demand: result.demand,
        }

        let currentSolution = solution;
        let iteration = 1;
        let isOptimal = false;

        while (iteration <= 10 && !isOptimal) {

            const { alpha, beta } = calculateDualVariables(currentSolution);

            isOptimal = checkOptimality(currentSolution, alpha, beta);

            if (!isOptimal) {
                currentSolution = optimizeSolution(currentSolution, alpha, beta);
                iteration++;
            } else {
                break;
            }
        }
        console.log(unitProfitMatrix);
        console.log(currentSolution.allocation);
        calculateTotalProfit(unitProfitMatrix, currentSolution.allocation);
        calculateTransportCosts(result.transportCostsMatrix, currentSolution.allocation, unitProfitMatrix);
        calculatePurchaseCosts(result.purchaseCosts, currentSolution.allocation, unitProfitMatrix);
        calculateIncome(result.sellingPrices, currentSolution.allocation, unitProfitMatrix);
    };
    const optimizeSolution = (solution: TransportSolution, alpha: number[], beta: number[]) => {
        const { allocation, profits } = solution;
        const numSuppliers = allocation.length;
        const numCustomers = allocation[0].length;

        // 1. Znajdź najbardziej dodatnią zmienną kryterialną
        let maxDelta = 0;
        let enteringRow = -1;
        let enteringCol = -1;

        for (let i = 0; i < numSuppliers; i++) {
            for (let j = 0; j < numCustomers; j++) {
                if (allocation[i][j] === 0) { // Tylko dla tras niebazowych
                    const delta = profits[i][j] - alpha[i] - beta[j];
                    if (delta > maxDelta) {
                        maxDelta = delta;
                        enteringRow = i;
                        enteringCol = j;
                    }
                }
            }
        }

        if (maxDelta <= 0) {
            return solution;
        }


        // 2. Znajdź pętlę dla wybranej zmiennej
        const loop = findLoop(allocation, enteringRow, enteringCol);
        if (!loop) {
            return solution;
        }


        // 3. Przeprowadź realokację
        const newAllocation = reallocateAlongLoop(allocation, loop);

        // 4. Zaktualizuj rozwiązanie
        const newSolution: TransportSolution = {
            ...solution,
            allocation: newAllocation
        };

        return newSolution;
    };

// Funkcja pomocnicza do znajdowania pętli
    const findLoop = (allocation: number[][], startRow: number, startCol: number) => {
        const numRows = allocation.length;
        const numCols = allocation[0].length;
        const loop = [{ row: startRow, col: startCol }];


        // Przykład uproszczony - szukamy wiersza i kolumny z komórkami bazowymi
        for (let i = 0; i < numRows; i++) {
            if (i !== startRow && allocation[i][startCol] > 0) {
                loop.push({ row: i, col: startCol });
                for (let j = 0; j < numCols; j++) {
                    if (j !== startCol && allocation[i][j] > 0) {
                        loop.push({ row: i, col: j });
                        if (allocation[startRow][j] > 0) {
                            loop.push({ row: startRow, col: j });
                            return loop;
                        }
                    }
                }
            }
        }

        return null;
    };

// Funkcja pomocnicza do realokacji wzdłuż pętli
    const reallocateAlongLoop = (allocation: number[][], loop: {row: number, col: number}[]) => {
        const newAllocation = allocation.map(row => [...row]);

        // Znajdź minimalną wartość w komórkach, z których odejmujemy
        let minAmount = Infinity;
        for (let i = 1; i < loop.length; i += 2) { // Komórki, z których odejmujemy
            const { row, col } = loop[i];
            minAmount = Math.min(minAmount, newAllocation[row][col]);
        }


        // Przeprowadź realokację
        for (let i = 0; i < loop.length; i++) {
            const { row, col } = loop[i];
            if (i % 2 === 0) { // Komórki, do których dodajemy
                newAllocation[row][col] += minAmount;
            } else { // Komórki, z których odejmujemy
                newAllocation[row][col] -= minAmount;
            }
        }

        return newAllocation;
    };


    const checkOptimality = (solution: TransportSolution, alpha: number[], beta: number[]) => {
        let isOptimal = true;

        solution.profits.forEach((row, i) => {
            row.forEach((profit, j) => {
                if (solution.allocation[i][j] === 0) {
                    const delta = profit - alpha[i] - beta[j];
                    if (delta > 0) {
                        isOptimal = false;
                    }
                }
            });
        });

        return isOptimal;
    };
    const calculateTotalProfit=(unitProfitMatrix:number[][],allocation:number[][] )=> {
        let totalProfit = 0;
        for (let i = 0; i < unitProfitMatrix.length; i++) {
            for (let j = 0; j < unitProfitMatrix.length; j++) {
                if(unitProfitMatrix[i][j]!==0) {
                    totalProfit+=unitProfitMatrix[i][j]*allocation[i][j];
                }
            }
        }
        console.log("Zysk: "+totalProfit);
    }
    const calculateTransportCosts =(transportCostsMatrix:number[][],allocation:number[][],unitProfitMatrix:number[][])=>{
       let totalTransportCosts =0;
        for (let i = 0; i < unitProfitMatrix.length; i++) {
            for (let j = 0; j < unitProfitMatrix.length; j++) {
                if(unitProfitMatrix[i][j]!==0) {
                    totalTransportCosts+=allocation[i][j]*transportCostsMatrix[i][j];
                }
            }
        }
        console.log("Koszty transportu: "+totalTransportCosts);
    }
    const calculatePurchaseCosts =(purchaseCosts:number[],allocation:number[][],unitProfitMatrix:number[][])=> {
        let totalPurchaseCosts =0;
        for (let i = 0; i < unitProfitMatrix.length; i++) {
            for (let j = 0; j < unitProfitMatrix.length; j++) {
                if(unitProfitMatrix[i][j]!==0) {
                    totalPurchaseCosts+=allocation[i][j]*purchaseCosts[i];
                }
            }
        }
        console.log("Koszty zakupu: "+totalPurchaseCosts);
    }
    const calculateIncome =(sellingPrices:number[],allocation:number[][],unitProfitMatrix:number[][])=> {
        let income =0;
        for (let i = 0; i < unitProfitMatrix.length; i++) {
            for (let j = 0; j < unitProfitMatrix.length; j++) {
                if(unitProfitMatrix[i][j]!==0) {
                    income+=allocation[i][j]*sellingPrices[j];
                }
            }
        }
        console.log("Income: "+income);
    }
    const calculateDualVariables = (solution: TransportSolution) => {
        const { allocation, profits } = solution;
        const numSuppliers = allocation.length;
        const numCustomers = allocation[0].length;

        const alpha: number[] = new Array(numSuppliers).fill(null);
        const beta: number[] = new Array(numCustomers).fill(null);

        // Ustawienie wartości dla fikcyjnych dostawców/odbiorców
        alpha[numSuppliers - 1] = 0;
        beta[numCustomers - 1] = 0;

        // Iteracyjne rozwiązywanie równań
        let changed: boolean;
        do {
            changed = false;
            allocation.forEach((row, i) => {
                row.forEach((alloc, j) => {
                    if (alloc > 0) {
                        if (alpha[i] !== null && beta[j] === null) {
                            beta[j] = profits[i][j] - alpha[i];
                            changed = true;
                        } else if (alpha[i] === null && beta[j] !== null) {
                            alpha[i] = profits[i][j] - beta[j];
                            changed = true;
                        }
                    }
                });
            });
        } while (changed);

        return { alpha, beta };
    };
    const calculatePotentialPath = (unitProfitMatrix: number[][], supply: number[], demand: number[]) => {
        const remainingSupply = [...supply];
        const remainingDemand = [...demand];
        const allocation: number[][] = Array.from({length: supply.length}, () =>
            new Array(demand.length).fill(0)
        );

        function findMaxProfit() {
            let max = -Infinity;
            let row = -1;
            let col = -1;

            for (let i = 0; i < unitProfitMatrix.length; i++) {
                for (let j = 0; j < unitProfitMatrix[i].length; j++) {
                    if (remainingSupply[i] > 0 && remainingDemand[j] > 0 && unitProfitMatrix[i][j] > max) {
                        max = unitProfitMatrix[i][j];
                        row = i;
                        col = j;
                    }
                }
            }

            return {row, col};
        }

        while (true) {
            const {row, col} = findMaxProfit();
            if (row === -1 || col === -1) break;
            const amount = Math.min(remainingSupply[row], remainingDemand[col]);
            allocation[row][col] = amount;
            remainingSupply[row] -= amount;
            remainingDemand[col] -= amount;
        }

        return allocation;
    }
    const unitProfitCalculator = (transportCostsMatrix: number[][], purchaseCosts: number[], sellingPrices:number[]  ) => {
        const unitProfitMatrix: number[][] = transportCostsMatrix.map(row =>
            new Array(row.length).fill(0)
        );
        for (let i = 0; i < transportCostsMatrix.length; i++) {
            for (let j = 0; j < transportCostsMatrix[i].length; j++) {
                unitProfitMatrix[i][j] = sellingPrices[j]-purchaseCosts[i]-transportCostsMatrix[i][j];
            }
        }
        return unitProfitMatrix;

    }
    const proccesDataForCalculating =(data:TransportProblemData)=>{
        const transportCostsMatrix: number[][] = [];

        data.suppliers.forEach((supplier) => {
            const row = data.customers.map(customer => {
                const customerKey =  customer.name;
                return supplier.transportCosts[customerKey];
            });

            transportCostsMatrix.push(row);
        });

        const supplyArray = data.suppliers.map(supplier => supplier.supply);

        const demandArray = data.customers.map(customer => customer.demand);

        const purchaseCostsArray = data.suppliers.map(supplier => supplier.purchasePrice);

        const sellingPricesArray = data.customers.map(customer => customer.sellingPrice || 0);


        return {
            supply: supplyArray,
            demand: demandArray,
            purchaseCosts: purchaseCostsArray,
            sellingPrices: sellingPricesArray,
            transportCostsMatrix: transportCostsMatrix,
        };
    }
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