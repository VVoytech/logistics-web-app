import { useNavigate } from "react-router-dom";
import { Menu, Button, Stack, Box } from "@mantine/core";

export const HomePage = () => {
    const navigate = useNavigate();

    const handleSubmit = () => {
        navigate("/cpmpre");
    };

    const handleSubmit2 = () => {
        navigate("/cpmpost");
    };

    return (
        <Stack
            h={300}
            bg="var(--mantine-color-body)"
            align="stretch"
            justify="center"
            gap={50} // Zwiększona wartość odstępu
        >
            {/* Opakowanie Menu w Box z display: block i width: 100% */}
            <Box style={{ display: 'block', width: '100%' }}>
                <Menu position="bottom-start" withArrow withinPortal={false}>
                    <Menu.Target>
                        <Button fullWidth>CPM</Button>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Item onClick={handleSubmit}>Poprzedzające</Menu.Item>
                        <Menu.Item onClick={handleSubmit2}>Następujące</Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Box>

            {/* Drugi przycisk */}
            <Button fullWidth>Zagadnienie pośrednika</Button>
        </Stack>
    );
};