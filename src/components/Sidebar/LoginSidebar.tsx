'use client';

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Button from "../buttons/Button";
import Input from "../inputs/Input";
import Sidebar from "./Sidebar";
import Checkbox from "../Checkbox";
import { TextLink } from "../Links";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

type Section = "login" | "register";

export default function LoginSidebar({ setOpen, open }: { setOpen: (open: boolean) => void, open: boolean }): JSX.Element {
    const [activeSection, setActiveSection] = useState<Section>("login");
    const [login, setLogin] = useState<{ email: string, password: string, remember: boolean }>({ email: "", password: "", remember: false });
    const [register, setRegister] = useState<{ email: string, password: string, confirmPassword: string }>({ email: "", password: "", confirmPassword: "" });
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { refreshUser } = useUser();

    useEffect(() => {
        if (error) {
            setTimeout(() => setError(null), 5000);
        }
    }, [error]);

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (login.email === "" || login.password === "") {
            setError("Please fill in all fields");
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: login.email,
                    password: login.password,
                    remember: login.remember
                })
            });

            if (!response.ok) {
                setError("Try Again: Invalid Credentials");
                return;
            } else {
                await refreshUser();
                setOpen(false);
                setLogin({ email: "", password: "", remember: false });
                router.refresh();
            }
        } catch (error) {
            console.error(error);
            setError("An error occurred, please try again");
        }
    }

    const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (register.email === "" || register.password === "" || register.confirmPassword === "") {
            setError("Please fill in all fields");
            return;
        }

        if (register.password !== register.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: register.email,
                password: register.password
            })
        });

        if (!response.ok) {
            setError("An error occurred, please try again");
            return;
        } else {
            setError("Account created successfully.");
            setRegister({ email: "", password: "", confirmPassword: "" });
            router.refresh();
        }
    }

    return (    
        <Sidebar open={open} setOpen={setOpen}>
            <div className="flex flex-col items-center gap-8">
                <div className="flex flex-col items-center text-3xl">
                    <h1>Logo</h1>
                    <h1>MY ACCOUNT</h1>
                </div>
                <div className="flex flex-col w-[80%] items-center gap-12">
                    <div className="flex flex-row relative w-full">
                        <div className="flex flex-row justify-around w-full text-lg">
                            <button className={`p-2 w-[30%] hover:text-opacity-80 ${activeSection !== "login" ? "hover:text-gray-700": ""}`} onClick={() => setActiveSection("login")}>Login</button>
                            <button className={`p-2 w-[30%] ${activeSection !== "register" ? "hover:text-gray-700": ""}`} onClick={() => setActiveSection("register")}>Register</button>
                        </div>
                        <motion.div 
                            layout
                            className="absolute bottom-0 h-0.5 bg-black"
                            initial={{ width: 0 }}
                            animate={{
                                width: "50%",
                                x: activeSection === "login" ? 0 : "100%"
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30
                            }}                        
                        />
                    </div>
                    {activeSection === "login" ? (
                        <form className="flex flex-col w-full gap-3 items-center" onSubmit={handleLoginSubmit}>
                            <Input className="!px-4" name="email" label="Email" placeholder="Email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} autoComplete="email"/>
                            <Input className="!px-4" name="password" label="Password" type="password" placeholder="Password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} autoComplete="current-password"/>
                            <div className="flex flex-row w-full justify-between items-center px-1">
                                <Checkbox label="Remember password?" bool={login.remember} setBool={(newBool: boolean) => setLogin({ ...login, remember: newBool })} />
                                <TextLink className="text-sm !text-blue-500 hover:!text-blue-700" text="Forgot password?" href="/forgot-password" />
                            </div>
                            <div className="flex flex-row w-full justify-center mt-3">
                                <Button name="submit" text="Submit" type="submit" />
                            </div>
                            <AnimatePresence>
                                {error && <motion.p className="text-red-500 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>{error}</motion.p>}
                            </AnimatePresence>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center gap-6 w-full">
                            <form className="flex flex-col w-full gap-8 items-center" onSubmit={handleRegisterSubmit}>
                                <div className="flex flex-col items-center w-full h-full gap-1">
                                    <Input className="!px-4" name="email" label="Email" placeholder="Email" value={register.email} onChange={(e) => setRegister({ ...register, email: e.target.value })} autoComplete="email" />
                                    <Input className="!px-4" name="password" type="password" label="Password" placeholder="Password" value={register.password} onChange={(e) => setRegister({ ...register, password: e.target.value})} autoComplete="new-password" />
                                    <Input className="!px-4" name="confirm-password" type="password" label="Confirm Password" placeholder="Confirm Password" value={register.confirmPassword} onChange={(e) => setRegister({ ...register, confirmPassword: e.target.value })} autoComplete="new-password" />
                                </div>
                                <Button className="w-full" name="register" text="Register" type="submit" />
                                <AnimatePresence>
                                    {error && <motion.p className="text-red-500 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>{error}</motion.p>}
                                </AnimatePresence>
                            </form>
                            <div className="bg-black w-[100%] h-[0.5px] mt-12 mb-2"></div>
                            <div className="flex flex-col w-full justify-center items-center font-light">
                                <TextLink href="/" text="Click Here to" className="!text-2xl !text-black" />
                                <TextLink href="/" text="Become A Vender" className="!text-2xl font-semibold !text-greenPrimary"/>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Sidebar>
    )
}