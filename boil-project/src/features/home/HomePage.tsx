import { useNavigate } from "react-router-dom";
import {
    Menu,
    Button,
    Stack,
    AppShell,
    Group,
    Burger,
    useMantineTheme,
    Card,
    Badge,
    Image,
    Text,
    Grid,
    Divider
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import logo from '../../assets/logo.png';

export const HomePage = () => {
    const navigate = useNavigate();

    const handleSubmit = () => {
        navigate("/cpmpre");
    };

    const handleSubmit2 = () => {
        navigate("/cpmpost");
    };

    const [opened, { toggle }] = useDisclosure();
    const theme = useMantineTheme();

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
                    <img src={logo} alt="Logo" style={{ height: 40 }} />
                    <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md" style={{ backgroundColor: theme.colors.gray[0] }}>
                <Stack
                    h="100%"
                    bg="var(--mantine-color-body)"
                    align="stretch"
                    justify="flex-start"
                    gap="sm"
                >
                    <Menu position="bottom-start" withArrow withinPortal={false}>
                        <Menu.Target>
                            <Button fullWidth>CPM</Button>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Item onClick={handleSubmit}>Poprzedzające</Menu.Item>
                            <Menu.Item onClick={handleSubmit2}>Następujące</Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                    <Button fullWidth>Zagadnienie pośrednika</Button>
                </Stack>
            </AppShell.Navbar>

            <AppShell.Main style={{ backgroundColor: theme.colors.gray[1], borderRadius: 8 }}>

                <Text fw={500}>Dostępne metody logistyki</Text>

                <Divider my="sm" />

                <Grid gutter="md">
                    {/* Pierwsza karta */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Card.Section>
                                <Image
                                    src="https://templatesfreedownload.com/wp-content/uploads/2020/07/Critical-Path-Method-Example-Project-Data.png"
                                    height={500}
                                    alt="Norway"
                                />
                            </Card.Section>

                            <Group justify="space-between" mt="md" mb="xs">
                                <Text fw={500}>Metoda CPM z podawaniem poprzednika</Text>
                                <Badge color="pink">Work in progress</Badge>
                            </Group>

                            <Text size="sm" c="dimmed">
                                W tej wersji metody CPM określasz, które zadania muszą zostać zakończone, zanim rozpoczniesz bieżące zadanie. Dla każdego zadania podajesz jego poprzedników (zadania, które muszą być wykonane wcześniej). Na podstawie tych zależności obliczana jest ścieżka krytyczna, czyli sekwencja zadań decydująca o minimalnym czasie realizacji projektu.
                            </Text>

                            <Button color="blue" fullWidth mt="md" radius="md" onClick={handleSubmit}>
                                Przetestuj
                            </Button>
                        </Card>
                    </Grid.Col>

                    {/* Druga karta */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Card.Section>
                                <Image
                                    src="https://i.imgflip.com/9nrich.jpg"
                                    height={500}
                                    alt="Norway"
                                />
                            </Card.Section>

                            <Group justify="space-between" mt="md" mb="xs">
                                <Text fw={500}>Metoda CPM z podawaniem następnej czynności</Text>
                                <Badge color="pink">Work in progress</Badge>
                            </Group>

                            <Text size="sm" c="dimmed">
                                W tej wersji określasz, które zadania mogą rozpocząć się dopiero po zakończeniu bieżącego zadania. Dla każdego zadania podajesz jego następników (zadania, które zależą od jego ukończenia). Ta metoda również pozwala na wyznaczenie ścieżki krytycznej, ale skupia się na zależnościach w przód, a nie wstecz.                            </Text>

                            <Button color="blue" fullWidth mt="md" radius="md" onClick={handleSubmit2}>
                                Przetestuj
                            </Button>
                        </Card>
                    </Grid.Col>
                </Grid>
            </AppShell.Main>
        </AppShell>
    );
};