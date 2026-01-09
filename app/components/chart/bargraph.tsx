"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


export default function BarGraph({
    data,
    title,
    xAxisKey,
    dataKeys,
    barColor,
}:{
    data: Record<string, any>[];
    title?: string;
    xAxisKey?: string;
    dataKeys: string[];
    barColor: string[];
}){
return(
    <div className='w-full h-96 p-4'>
        {title && <h1 className='text-2xl font-bold mb-4 text-gray-800'>{title}</h1>}
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey={xAxisKey}/>
                <YAxis/>
                <Tooltip/>
                <Legend/>
                {dataKeys.map((key, index) => (
                    <Bar 
                    key={key}
                    dataKey={key}
                    fill={barColor[index] || '#3b82f6'}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    </div>
)
}