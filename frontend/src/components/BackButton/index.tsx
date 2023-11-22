import { useNavigate } from "react-router-dom";

const BackButton = ({className = ""} : {className?: string}) => {
    const navigation = useNavigate();
    return (
    <button
        onClick={() => navigation(-1)}
        className={`btn btn-info min-w-[16rem] ${className && className }`}  
    >
        Back
    </button>);
};

export default BackButton;