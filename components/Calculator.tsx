import React, { useState } from 'react';
import { X, Minus, Plus, Divide, X as Multiply, Delete, Equal, Calculator as CalcIcon } from 'lucide-react';
import Draggable from 'react-draggable';

const Calculator: React.FC = () => {
    const [display, setDisplay] = useState('0');
    const [firstOperand, setFirstOperand] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const nodeRef = React.useRef(null);

    const inputDigit = (digit: string) => {
        if (waitingForSecondOperand) {
            setDisplay(digit);
            setWaitingForSecondOperand(false);
        } else {
            setDisplay(display === '0' ? digit : display + digit);
        }
    };

    const inputDecimal = () => {
        if (waitingForSecondOperand) {
            setDisplay('0.');
            setWaitingForSecondOperand(false);
            return;
        }
        if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    };

    const clear = () => {
        setDisplay('0');
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecondOperand(false);
    };

    const handleOperator = (nextOperator: string) => {
        const inputValue = parseFloat(display);

        if (operator && waitingForSecondOperand) {
            setOperator(nextOperator);
            return;
        }

        if (firstOperand === null) {
            setFirstOperand(inputValue);
        } else if (operator) {
            const result = calculate(firstOperand, inputValue, operator);
            setDisplay(String(result));
            setFirstOperand(result);
        }

        setWaitingForSecondOperand(true);
        setOperator(nextOperator);
    };

    const calculate = (first: number, second: number, op: string) => {
        switch (op) {
            case '+': return first + second;
            case '-': return first - second;
            case '*': return first * second;
            case '/': return first / second;
            default: return second;
        }
    };

    const performCalculation = () => {
        if (operator && firstOperand !== null) {
            const secondOperand = parseFloat(display);
            const result = calculate(firstOperand, secondOperand, operator);
            setDisplay(String(result));
            setFirstOperand(null);
            setOperator(null);
            setWaitingForSecondOperand(true);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[100] bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-xl shadow-emerald-500/30 transition-all hover:scale-110 active:scale-95 animate-in fade-in slide-in-from-bottom-4"
            >
                <CalcIcon className="w-6 h-6" />
            </button>
        )
    }

    return (
        <Draggable nodeRef={nodeRef} handle=".handle">
            <div ref={nodeRef} className="fixed bottom-20 right-6 z-[100] bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 w-64 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="handle bg-slate-800 p-3 flex justify-between items-center cursor-move active:cursor-grabbing border-b border-slate-700 select-none">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <CalcIcon className="w-3 h-3" /> Calculadora
                    </span>
                    <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-4 bg-slate-950 text-right">
                    <div className="text-3xl font-mono text-emerald-500 break-all">{display}</div>
                </div>

                <div className="grid grid-cols-4 gap-1 p-2 bg-slate-900">
                    <button onClick={clear} className="col-span-3 bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-lg text-xs font-bold">AC</button>
                    <button onClick={() => handleOperator('/')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 p-3 rounded-lg flex items-center justify-center"><Divide className="w-4 h-4" /></button>

                    <button onClick={() => inputDigit('7')} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-bold">7</button>
                    <button onClick={() => inputDigit('8')} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-bold">8</button>
                    <button onClick={() => inputDigit('9')} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-bold">9</button>
                    <button onClick={() => handleOperator('*')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 p-3 rounded-lg flex items-center justify-center"><Multiply className="w-4 h-4" /></button>

                    <button onClick={() => inputDigit('4')} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-bold">4</button>
                    <button onClick={() => inputDigit('5')} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-bold">5</button>
                    <button onClick={() => inputDigit('6')} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-bold">6</button>
                    <button onClick={() => handleOperator('-')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 p-3 rounded-lg flex items-center justify-center"><Minus className="w-4 h-4" /></button>

                    <button onClick={() => inputDigit('1')} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-bold">1</button>
                    <button onClick={() => inputDigit('2')} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-bold">2</button>
                    <button onClick={() => inputDigit('3')} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-bold">3</button>
                    <button onClick={() => handleOperator('+')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 p-3 rounded-lg flex items-center justify-center"><Plus className="w-4 h-4" /></button>

                    <button onClick={() => inputDigit('0')} className="col-span-2 bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-bold">0</button>
                    <button onClick={inputDecimal} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-bold">.</button>
                    <button onClick={performCalculation} className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20"><Equal className="w-4 h-4" /></button>
                </div>
            </div>
        </Draggable>
    );
};

export default Calculator;
