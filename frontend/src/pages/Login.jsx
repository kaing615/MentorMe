import React, { useState } from 'react';
import ImageForLogin from "../assets/ImageForLogin.jpg";
import fb from "../assets/facebook.png";
import gg from "../assets/google.png";
import mcs from "../assets/microsoft.png";
import { IoArrowForward } from 'react-icons/io5';

const Login = () => {
    const [selected, setSelected] = useState("mentee");


    return (
        <div className = "flex items-center">

            <div className = "w-1/2 flex-col items-center">

                <h1 className = "mb-4 text-5xl font-bold text-center ml-37">Log in</h1>

                <div title = "Login form" className = "flex flex-col ml-30">

                    <div title = "I'm a Mentor or I'm a Mentee" className = "flex flex-row mb-4 gap-50 mx-auto relative">
                        <div 
                            title = "Mentee" 
                            className = {`text-2xl font-Inter cursor-pointer w-[180px] text-center pb-2 transition-colors duration-300 ${
                                selected === "mentee" ? "text-slate-900" : "text-slate-500"
                            }`}
                            onClick={() => setSelected("mentee")}
                        >
                            I'm a mentee
                        </div>
                        <div 
                            title = "Mentor" 
                            className = {`text-2xl font-Inter cursor-pointer w-[180px] text-center pb-2 transition-colors duration-300 ${
                                selected === "mentor" ? "text-slate-900" : "text-slate-500"
                            }`}
                            onClick={() => setSelected("mentor")}
                        >
                            I'm a mentor
                        </div>
                        
                        {/* Sliding underline */}
                        <div 
                            className = "absolute bottom-0 h-[2px] bg-slate-800 transition-all duration-300 ease-in-out"
                            style={{
                                width: '180px',
                                left: selected === "mentee" ? '0px' : '380px'
                            }}
                        />
                    </div>

                    <div className = "flex flex-col items-start w-[700px]">
                        <label className = "block mb-1 text-lg font-medium text-left">Email</label>
                        <div alt = "Username" className = "mb-4 ">
                            <input type = "text" placeholder = "Username or Email ID" className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[700px] focus:outline-none" />
                        </div>
                    </div>

                    <div className = "flex flex-col items-start w-[700px]">
                        <label className = "block mb-1 text-lg font-medium text-left">Password</label>
                        <div alt = "Password" className = "mb-4 ">
                            <input type = "password" placeholder = "Enter password" className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[700px] focus:outline-none" />
                        </div>
                    </div>

                    <div alt = "Create Account Button - Apply to be a Mentor" className = "mb-1 items">
                        <button className="flex items-center bg-slate-950 text-left py-3 px-6 mb-3.5 gap-2 rounded-lg border-0 cursor-pointer hover:bg-slate-800 transition-colors duration-200">
                        <span className="text-white text-md font-bold">Sign In</span>
                        <IoArrowForward className="text-white text-lg" />
                        </button>
                    </div>

                    {/* Container with fixed space for social media */}
                    <div className="relative h-32 w-full">
                        <div className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out ${
                            selected === "mentee" 
                                ? "opacity-100 transform translate-y-0" 
                                : "opacity-0 transform -translate-y-4 pointer-events-none"
                        }`}>
                            <div className="flex items-center w-[700px]">
                                <hr className="flex-1 border-t border-slate-400" />
                                <span className="mx-4 text-lg font-medium text-slate-400 whitespace-nowrap">Sign In with</span>
                                <hr className="flex-1 border-t border-slate-400" />
                            </div>

                            <div alt = "Social Media Sign In" className = "flex flex-row mb-4 gap-12.5 mt-3">
                                <button
                                    onClick={() => window.open("https://facebook.com")}
                                    className="flex flex-row items-center justify-center w-[200px] px-22 py-3 border border-gray-400 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                                    >
                                    <img src={fb} alt="Facebook" className="h-6 mr-2" />
                                    <span className="text-lg font-medium text-blue-600">Facebook</span>
                                </button>


                                <button
                                    onClick={() => window.open("https://google.com")}
                                    className="flex flex-row items-center justify-center w-[200px] px-22 py-3 border border-gray-400 rounded-xl cursor-pointer hover:bg-red-50 transition-colors duration-200"
                                    >
                                    <img src={gg} alt="Google" className="h-6 mr-2" />
                                    <span className="text-lg font-medium text-red-500">Google</span>
                                </button>

                                <button
                                    onClick={() => window.open("https://microsoft.com")}
                                    className="flex flex-row items-center justify-center w-[200px] px-22 py-3 border border-gray-400 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                    >
                                    <img src={mcs} alt="Microsoft" className="h-6 mr-2" />
                                    <span className="text-lg font-medium text-black">Microsoft</span>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            <div className = "w-1/2 flex justify-end" alt = "Log In Image">
                <img src = {ImageForLogin} alt = "Login" 
                className = "object-cover w-150 h-auto" />
            </div>
            
        </div>
    )
};

export default Login;