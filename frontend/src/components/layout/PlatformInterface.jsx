import React from 'react';
import Header from '../common/header_signup_signin';
import { Outlet } from 'react-router-dom';

const PlatformInterface = () => {
    return (
        <div className="w-full">
            <Header />
            <Outlet />
        </div>
    );
}

export default PlatformInterface;