import React, { useState, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField';
import AccountDropdown from './AccountDropdown'
import TxButton from './TxButton'
import Dropdown from '../components/Dropdown'
import CallContractDropdown from '../components/CallContractDropdown'
import Modal, { ModalTemplateHandler } from '../components/ModalTemplate'
import { addConsoleLine } from '../actions'
import { ApiPromise} from '@polkadot/api';
import { Abi } from '@polkadot/api-contract';
import { SubmittableResultValue } from '@polkadot/api/types';
import { CodesObject, InstancesObject } from './ChainStatus'

type PropType = {
	api: ApiPromise;
	codes: CodesObject;
  instances: InstancesObject;
  selectedChainId: string;
}

const CallContractModalButton = ({api,codes,instances, selectedChainId}:PropType) => {
  const dispatch = useDispatch();
	const setResult = (x: string) => dispatch(addConsoleLine(x))

  const [gasLimit, setGasLimit] = useState(500000)
  const [value, setValue] = useState(0)
  const [instance,setInstance] = useState<InstancesObject[keyof InstancesObject] | null>(null);
  const [abi,setAbi] = useState<Abi>();
  const [callMessage, setCallMessage] = useState<Object>();

  const modalRef = useRef({} as ModalTemplateHandler);

  useEffect(()=>{
    setInstance(null);
  },[selectedChainId]);

  useEffect(() => {
    setCallMessage(undefined)
    if(instance!=null){
      setAbi(codes[instance.codeHash].abi)
    }
  },[instance,codes])

  const onSend = ({ events = [], status}: SubmittableResultValue ) => {
    modalRef.current.handleClose()

    setResult('Transaction status: ' + status.type);

    if (status.isFinalized) {
      setResult('Completed at block hash: \n'+ status.asFinalized.toString());
      setResult('Events:');

      events.forEach(({ phase , event: { data, method, section } }) => {
        setResult('\t'+phase.toString()+`: ${section}.${method} `+ data.toString());
      });
      // process.exit(0);
    }
  }

  return(<>
    <Button style = {{marginBottom:"10px",width:"100%"}} color="primary" variant="contained" onClick={()=>modalRef.current.handleOpen()}>
      call contract
    </Button>
    <Modal
      ref={modalRef}
    >
      <AccountDropdown/>
      <TextField
        label="Gas limit"
        type="number"
        defaultValue={gasLimit}
        InputLabelProps={{shrink: true}}
        onChange={(e: any)=>{setGasLimit(e.target.value)}}
        variant="filled"
        style = {{marginBottom:"10px",width:"100%"}}
      />

      <TextField
        label="Value"
        type="number"
        defaultValue={value}
        InputLabelProps={{shrink: true}}
        onChange={(e: any)=>{setValue(e.target.value)}}
        variant="filled"
        style = {{marginBottom:"10px",width:"100%"}}
      />

      <Dropdown
        label="Instance"
        value={instance}
        valuesList={Object.values(instances)}
        setValue={(e: any) => setInstance(e.target.value)}
        display={(x)=>{return `${x.name}(${x.address})`}}
      />

      { (!!abi)?
      <CallContractDropdown
        abi={abi}
        setCallMessage={setCallMessage}
      />:[]}
      
      {instance!=null?
      <TxButton
        label={"send"}
        tx={api.tx.contract?'contract.call':'contracts.call'}
        params={[
          instance.address,
          value,
          gasLimit,
          !!callMessage?callMessage:[]
        ]}
        onSend={onSend}
        style = {{marginBottom:"10px",width:"100%"}}
      />
      :["cannot send"]}
    </Modal>
  </>)
}

export default CallContractModalButton