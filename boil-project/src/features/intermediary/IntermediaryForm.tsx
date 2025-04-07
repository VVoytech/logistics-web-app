import {
    Button,
    Card,
    Container,
    Divider,
    Menu,
} from "@mantine/core";
import {
    IconCategory2,
    IconHome,
    IconSchema
} from "@tabler/icons-react";
import {useNavigate} from "react-router-dom";

export const IntermediaryForm = () => {
    const navigate = useNavigate();

    const handleHome = () => {
        navigate("/");
    };

    const handlePost = () => {
        navigate("/cpmpost");
    };

    const handlePre = () => {
        navigate("/cpmpre")
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2vw", padding: "2vw" }}>
            <div style={{ display: "flex", gap: "2vw", width: "100%" }}>
                <Card
                    shadow="md"
                    style={{
                        width: "25vw",
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
                                <Menu.Item
                                    leftSection={<IconHome size={18} />}
                                    onClick={handleHome}
                                >
                                    Strona główna
                                </Menu.Item>
                                <Menu.Item
                                    leftSection={<IconSchema size={18} />}
                                    onClick={handlePost}
                                >
                                    CPM następnik
                                </Menu.Item>
                                <Menu.Item
                                    leftSection={<IconSchema size={18} />}
                                    onClick={handlePre}
                                >
                                    CPM poprzednik
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>

                        <Divider my="md" />

                    </Container>
                </Card>
            </div>
        </div>
    );
};