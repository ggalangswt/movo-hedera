'use client'
import {RefreshCcw} from 'lucide-react'
import { useState } from 'react'
interface RefreshButtonProps{
    onClick: () => void,
    title?: string
    className?: string
    size?: number
}

export default function RefreshButton({onClick, title = 'Refresh', className = '', size = 16}: RefreshButtonProps) {
    const [isSpinning, setIsSpinning] = useState(false);
    const handleClick = async () => {
        setIsSpinning(true)
        await onClick()
        setTimeout(() =>{
            setIsSpinning(false)
        }, 600)
    }
    return(
        <button
            onClick={handleClick}
            disabled={isSpinning}
            title={title}
            aria-label={title}
            className={`grop relative
                text-gray-500 hover:scale-105
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-95
                ${className}`}
        >
            <RefreshCcw 
                size={size}
                className={`transition-transform
                    duration-500 ease-in-out
                    ${isSpinning ? 'animate-spin' : 'group-hover:rotate-90'}`}
            />
            <span className='absolute inset-0 rounded-lg bg-blue-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200'></span>
        </button>
    )
}