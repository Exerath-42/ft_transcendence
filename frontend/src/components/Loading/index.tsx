import { useEffect } from "react";

import { useMessage } from "../../modules/alert/MessageContext";

const LoadingPage = () => {
    const {customAlert} = useMessage();
    useEffect(() => {
        
        const timer = setTimeout(() => {
            customAlert("Problem loading page, try again!");
            window.location.href = "/";
        }, 5000); 
        
        return () => clearTimeout(timer);
    }, []); 

    return (
        <>
            <span className="loading loading-spinner loading-lg"></span>
        </>
    );
};

export default LoadingPage;
