import React, { useState } from 'react';
import ImageForSignUp from "../assets/ImageForSignUp.jpg";
import fb from "../assets/facebook.png";
import gg from "../assets/google.png";
import mcs from "../assets/microsoft.png";
import { authApi } from "../api/modules/auth.api";
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { IoArrowForward } from 'react-icons/io5';

const SignUp = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const onFinish = async( values ) => {
        try {
            console.log(values);
            const res = await authApi.signup(values);
            message.success(res?.data?.message || "Sign up successful");
            navigate(`/auth/verify-email?email=${encodeURIComponent(values.email)}`);
        } catch (error) {
            console.error("Error signing up:", error);
        }
    }

    return (
        <div className = "flex items-center">
            <div className = "w-1/2" alt = "Sign Up Image">
                <img src = {ImageForSignUp} alt = "Sign Up" 
                className = "object-cover w-auto h-250" />
            </div>
            

            <div className = "w-1/2">
                <h1 className = "mb-4 text-5xl font-medium text-center">Create Your Account</h1>
                <div alt = "Sign Up Form" className = "flex flex-col">
                    <label className = "block mb-1 text-lg font-medium text-left">Full Name</label>
                    <div alt = "Full Name" className = "flex flex-row mb-4 gap-6">
                        <input type = "text" placeholder = "First Name" className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[330px] focus:outline-none" />
                        <input type = "text" placeholder = "Last Name" className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[345px] focus:outline-none" />
                    </div>

                    <label className = "block mb-1 text-lg font-medium text-left">Username</label>
                    <div alt = "Username" className = "mb-4">
                        <input type = "text" placeholder = "Username" className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[699px] focus:outline-none" />
                    </div>

                    <label className = "block mb-1 text-lg font-medium text-left">Email</label>
                    <div alt = "Email" className = "mb-4">
                        <input type = "text" placeholder = "Email ID" className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[699px] focus:outline-none" />
                    </div>

                    <div className = "flex flex-row mb-1 gap-69.5">
                        <label className = "text-lg font-medium text-left">Password</label>
                        <label className = "text-lg font-medium text-left">Confirm Password</label>
                    </div>
                    <div alt = "Password" className = "flex flex-row mb-4 gap-6">
                        <input type = "password" placeholder = "Password" className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[330px] focus:outline-none" />
                        <input type = "password" placeholder = "Confirm Password" className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[345px] focus:outline-none" />
                    </div>

                    <div alt = "Create Account Button - Apply to be a Mentor" className = "flex flex-row mb-4 gap-75">
                        <button className="flex items-center bg-slate-950 text-left py-3 px-6 mb-3.5 gap-2 rounded-lg border-0 cursor-pointer hover:bg-slate-800 transition-colors duration-200">
                        <span className="text-white text-md font-bold">Create Account</span>
                        <IoArrowForward className="text-white text-lg" />
                        </button>

                        <button className="flex items-center text-left py-3 px-6 mb-3.5 gap-1 rounded-lg border-0 cursor-pointer">
                        <span className="text-black text-md font-bold">Apply to be a Mentor</span>
                        <IoArrowForward className="text-black text-lg" />
                        </button>
                    </div> 

                    <div alt = "Sign Up with" className = "flex flex-row">
                        <hr className="border-t border-slate-400 w-70 my-4" />
                        <span className="mx-4 text-lg font-medium text-slate-400">Sign Up with</span>
                        <hr className="border-t border-slate-400 w-70 my-4" />
                    </div>
                    
                    <div alt = "Social Media Sign Up" className = "flex flex-row mb-4 gap-4">
                        <button alt = "Facebook Sign Up" onClick={() => window.open("https://facebook.com")}  
                        className = "flex flex-row items-center px-15 py-3 border border-gray-400 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors duration-200">
                            <img src={fb} alt="Facebook" className="h-6 mr-2" />
                            <span className="text-lg font-medium text-blue-600">Facebook</span>
                        </button>

                        <button alt = "Google Sign Up" onClick={() => window.open("https://google.com")} className = "flex flex-row items-center px-15 py-3 border border-gray-400 rounded-xl cursor-pointer hover:bg-red-50 transition-colors duration-200">
                            <img src={gg} alt="Google" className="w-6 h-6 mr-2" />
                            <span className="text-lg font-medium text-red-500">Google</span>
                        </button>

                        <button alt = "Microsoft Sign Up" onClick={() => window.open("https://microsoft.com")} className = "flex flex-row items-center px-15 py-3 border border-gray-400 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors duration-200">
                            <img src={mcs} alt="Microsoft" className="w-6 h-6 mr-2" />
                            <span className="text-md font-medium text-black">Microsoft</span>
                        </button>
                    </div>
                </div>
            </div>
            
        </div>
    
    );
};

export default SignUp;