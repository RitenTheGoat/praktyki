"use client"

import { useState } from "react"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"

export default function Add({handleAdd}){
    const [new_nazwa, set_new_nazwa] = useState(null)
    const [new_opis, set_new_opis] = useState(null)
    const [new_cena, set_new_cena] = useState(null)
    const [new_zdj, set_new_zdj] = useState(null)

    return(

        <Card>
            nazwa
            <Input onChange={(e)=>set_new_nazwa(e.target.value)}></Input>
            opis
            <Input onChange={(e)=>set_new_opis(e.target.value)}></Input>
            cena
            <Input onChange={(e)=>set_new_cena(e.target.value)}></Input>
            zdjecie
            <Input type="file" onChange={(e)=>set_new_zdj(e.target.files[0])}></Input>

            <Button onClick={()=>handleAdd(new_nazwa,new_opis,new_cena,new_zdj)}>dodaj</Button>
        </Card>
    )
}