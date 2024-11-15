"use client"
import PocketBase from 'pocketbase';
import { useEffect, useState } from 'react';

const pb = new PocketBase('http://172.16.15.139:8080');
export default function Chat(){
    const[dane,setDane] = useState(null)
    useEffect(() => {
        const getData = async () => {
            try {
                const resultList = await pb.collection('chat').getList(1, 50, {
                    sort: '-created',
                });
                setDane(resultList.items)
                console.log(resultList)
            } catch (error) {

            }
        }

        getData()

        pb.collection('chat').subscribe('*', function (e) {
            console.log(e.action);
            console.log(e.record);
            if(e.action == "create"){
            setDane((prev)=>(
                [...prev, e.record]
            ))
        }
        });


    }, [])

    
    
    


    return <div>
            {
                dane &&
                dane.map((wiadomosc)=>(
                    <p key={wiadomosc.id}>{wiadomosc.wiadomosc} </p>
                ))
            }

        </div>
    
}