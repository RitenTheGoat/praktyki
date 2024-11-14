"use client"
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react"
import PocketBase from 'pocketbase';
import Delitem from '@/components/delitem';
import Edititem from '@/components/edit';
import Additem from '@/components/additem';
import Image from "next/image";

const pb = new PocketBase('http://172.16.15.139:8080');



export default function Home(){
const [data,setdata] = useState([])
useEffect(()=>{
const view = async ()=>{
try{
    const records = await pb.collection('komputery').getFullList({
        sort: '-created',
    });
    setdata(records)
}catch(err){
    console.log(err)
}


}

view()





},[])

const handleDel = async (idToDel)=>{

    await pb.collection('komputery').delete(idToDel);
    setdata(data.filter((data) => (data.id !== idToDel)))
}
const handleAdd = async (new_nazwa,new_opis,new_cena,new_zdj)=>{
    const formdata = new FormData()
    if(new_nazwa)formdata.append("nazwa",new_nazwa)
    if(new_cena)formdata.append("cena",new_cena)
    if(new_opis)formdata.append("opis",new_opis)
    if(new_zdj)formdata.append("zdj",new_zdj)
    const record = await pb.collection('komputery').create(formdata);
    setdata((prevData)=> [record, ...prevData])

}
const handleEdit = async (new_nazwa,new_opis,new_cena,new_zdj,idToEdit)=>{
    const formdata = new FormData()
    if(new_nazwa)formdata.append("nazwa",new_nazwa)
    if(new_cena)formdata.append("cena",new_cena)
    if(new_opis)formdata.append("opis",new_opis)
    if(new_zdj)formdata.append("zdj",new_zdj)
    const record = await pb.collection('komputery').update(idToEdit, formdata);
    setdata(data.map((item)=>(item.id === idToEdit ? record : item)))
}




    return(
        <div>
{
    data.map((item)=>(
        <Card key={item.id} className="flex flex-col items-center ">
        nazwa: {item.nazwa}
        <br></br>
        cena: {item.cena}zł
        <br></br>
        opis: {item.opis}

        {item.zdj ? (
            <Image
            src={pb.files.getUrl(item, item.zdj)}
            width={90}
            height={90}
            alt="sd"
            ></Image>
        ) :(<p>nie ma zdjecia</p>)

        }
            <Delitem handleDel={handleDel} idToDel={item.id}></Delitem>
            <Edititem handleEdit={handleEdit} idToEdit={item.id}></Edititem>

        </Card>




    ))
}



<Additem handleAdd={handleAdd}></Additem>
        </div>
    )
}