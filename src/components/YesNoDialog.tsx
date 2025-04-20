import { useState } from "react";
import style from '../styles/editor.module.css'

interface ModalProps {
    title?: string,
    children?: React.ReactNode,
    onYes?: () => void;
    onNo?: () => void;
}

const YesNoDialog = (props: ModalProps) => {
    return (
        <div className={style.dialog}>
            <div className={style['dialog-modal']}>
                <div className={style['dialog-content']}>
                    <h2>{props.title}</h2>
                    {props.children}
                </div>
                <br></br>
                <div className={style['dialog-choice']}>
                    <div 
                        className={style['dialog-button']}
                        onClick={props.onYes}
                    >Yes</div>
                    <div 
                        className={style['dialog-button']}
                        onClick={props.onNo}
                    >No</div>
                </div>
            </div>
        </div>
    )
}

export default YesNoDialog;