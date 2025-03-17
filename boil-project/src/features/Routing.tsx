import {Navigate, RouteObject, useRoutes} from "react-router-dom";
import {CpmPreForm} from "./cpm/CpmPreForm.tsx";
import {HomePage} from "./home/HomePage.tsx";
import {CpmPostForm} from "./cpm/CpmPostForm.tsx";

const publicRoutes: RouteObject[] = [
    {
        path: '/',
        element: <HomePage/>
    },
    {
        path: '/cpmpre',
        element: <CpmPreForm/>
    },
    {
        path: '/cpmpost',
        element: <CpmPostForm/>
    },
    {
        path: '*',
        element: <Navigate to="/" replace/>
    }
]

export const Routing = () => {
    return useRoutes(publicRoutes);
}