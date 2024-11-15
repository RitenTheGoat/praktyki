"use client"
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import PocketBase from 'pocketbase';
import { useEffect, useState } from 'react';

const pb = new PocketBase('http://172.16.15.139:8080');
export default function Chat(){
    const[dane,setDane] = useState(null)
    const [msg, setmsg] = useState(null)
    const userId = "g10chaiscfm0y32"

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

    const handleSend = (e) =>{
        setmsg(e.target.value)
    }
    const handleAdd = async () =>{
        const data = {
            user_id: userId,
            wiadomosc: msg
        }
        const record = await pb.collection('chat').create(data);

    }
const getClasName = (id_msg) =>{
   const className2="flex justify-start"

    if(userId == id_msg){
        const className1="flex justify-end"
        return (
            className1
        )
        }else{
            return( className2 )

        } 
    }
    return  <div className="flex flex-col justify-center items-center"> 
           


            <Card className="w-[50%] h-[50vh]">
            {
                dane &&
                dane.map((wiadomosc)=>(
                    <div key={wiadomosc.id} className={getClasName(wiadomosc.user_id)}>
                    <Card className="w-[50%] p-5">
                        <p>{wiadomosc.wiadomosc}</p>
                    </Card>
                    </div>
                ))
            }
            </Card>

            <div className='flex mt-5 w-[50%] gap-2'>
                <Input onChange={(e)=>handleSend(e)}>
                </Input>
                <Button onClick={handleAdd}>
                    <Send></Send>
                </Button>
            </div>


        </div>
    
}