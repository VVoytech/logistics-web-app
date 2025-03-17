import './App.css'
import {MantineProvider} from "@mantine/core";
import {BrowserRouter} from "react-router-dom";
import {Routing} from "./features/Routing.tsx";



function App() {

    return (
        <MantineProvider>
            <BrowserRouter>
                <Routing/>
            </BrowserRouter>
        </MantineProvider>
    );
}

export default App
