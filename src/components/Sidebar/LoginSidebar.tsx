'use client';

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Button from "../buttons/Button";
import Input from "../inputs/Input";
import Sidebar from "./Sidebar";
import Checkbox from "../Checkbox";
import { TextLink } from "../Links";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FaStore } from "react-icons/fa";

type Section = "login" | "register";

export default function LoginSidebar({ setOpen, open }: { setOpen: (open: boolean) => void, open: boolean }): JSX.Element {
    const [activeSection, setActiveSection] = useState<Section>("login");
    const [login, setLogin] = useState<{ email: string, password: string, remember: boolean }>({ email: "", password: "", remember: false });
    const [register, setRegister] = useState<{ email: string, password: string, confirmPassword: string }>({ email: "", password: "", confirmPassword: "" });
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (error) {
            setTimeout(() => setError(null), 5000);
        }
    }, [error]);

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        if (login.email === "" || login.password === "") {
            setError("Please fill in all fields");
            setIsSubmitting(false);
            return;
        }
        
        try {
            const result = await signIn('credentials', {
                email: login.email,
                password: login.password,
                redirect: false,
            });

            if (result?.error) {
                setError("Try Again: Invalid Credentials");
                setIsSubmitting(false);
                return;
            }

            setOpen(false);
            setLogin({ email: "", password: "", remember: false });
            router.refresh();
            setIsSubmitting(false);
        } catch (error) {
            console.error(error);
            setError("An error occurred, please try again");
            setIsSubmitting(false);
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
            await signIn("credentials", {
                email: register.email,
                password: register.password,
                redirect: false,
            });
            setOpen(false);
            router.refresh();
        }
    }

    return (
        <Sidebar open={open} setOpen={setOpen}>
            <div className="flex flex-col h-full px-6 py-8">
                <h1 className="text-2xl font-semibold mb-8 text-center">Welcome Back</h1>
                
                {/* Login/Register Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="relative flex rounded-lg bg-gray-100 p-1">
                        <button
                            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                                activeSection === "login"
                                    ? "bg-white text-gray-900 shadow"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                            onClick={() => setActiveSection("login")}
                        >
                            Login
                        </button>
                        <button
                            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                                activeSection === "register"
                                    ? "bg-white text-gray-900 shadow"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                            onClick={() => setActiveSection("register")}
                        >
                            Register
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeSection === "login" ? (
                        <motion.form
                            key="login"
                            className="flex flex-col gap-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleLoginSubmit}
                        >
                            <Input
                                name="email"
                                label="Email"
                                placeholder="Enter your email"
                                value={login.email}
                                onChange={(e) => setLogin({ ...login, email: e.target.value })}
                                autoComplete="email"
                                className="w-full"
                            />
                            <Input
                                name="password"
                                label="Password"
                                type="password"
                                placeholder="Enter your password"
                                value={login.password}
                                onChange={(e) => setLogin({ ...login, password: e.target.value })}
                                autoComplete="current-password"
                                className="w-full"
                            />
                            <div className="flex items-center justify-between">
                                <Checkbox
                                    label="Remember me"
                                    bool={login.remember}
                                    setBool={(newBool: boolean) => setLogin({ ...login, remember: newBool })}
                                />
                                <TextLink
                                    href="/forgot-password"
                                    text="Forgot password?"
                                    className="text-sm text-green-600 hover:text-green-700"
                                />
                            </div>
                            <Button
                                text={isSubmitting ? "Signing in..." : "Sign In"}
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-2"
                            />
                        </motion.form>
                    ) : (
                        <motion.form
                            key="register"
                            className="flex flex-col gap-4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleRegisterSubmit}
                        >
                            <Input
                                name="email"
                                label="Email"
                                placeholder="Enter your email"
                                value={register.email}
                                onChange={(e) => setRegister({ ...register, email: e.target.value })}
                                autoComplete="email"
                                className="w-full"
                            />
                            <Input
                                name="password"
                                type="password"
                                label="Password"
                                placeholder="Create a password"
                                value={register.password}
                                onChange={(e) => setRegister({ ...register, password: e.target.value })}
                                autoComplete="new-password"
                                className="w-full"
                            />
                            <Input
                                name="confirm-password"
                                type="password"
                                label="Confirm Password"
                                placeholder="Confirm your password"
                                value={register.confirmPassword}
                                onChange={(e) => setRegister({ ...register, confirmPassword: e.target.value })}
                                autoComplete="new-password"
                                className="w-full"
                            />
                            <Button
                                text="Create Account"
                                type="submit"
                                className="w-full mt-2"
                            />
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.p
                            className="mt-4 text-sm text-center text-red-600"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Vendor Link */}
                <div className="mt-auto pt-6 border-t text-center">
                    <TextLink
                        href="/vendor-signup"
                        text="Become a Vendor"
                        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                        startingIcon={<FaStore className="w-4 h-4" />}
                    />
                </div>
            </div>
        </Sidebar>
    );
}