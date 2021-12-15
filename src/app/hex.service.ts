import {Act} from "./interfaces";
import {JsSignatureProvider} from 'eosjs/dist/eosjs-jssig';
import {Api, JsonRpc} from "eosjs";
import {createInitialTypes, getTypesFromAbi, hexToUint8Array, SerialBuffer} from "eosjs/dist/eosjs-serialize";
import {Abi} from "eosjs/dist/eosjs-rpc-interfaces";

export class HexService {

	abiCache: { [name: string]: Abi } = {};

	async decode(act: Act) {
		const signatureProvider = new JsSignatureProvider([]);
		const rpc = new JsonRpc('https://chain.wax.io', {fetch: fetch as any});
		const api = new Api({
			rpc,
			signatureProvider,
			textDecoder: new TextDecoder() as any,
			textEncoder: new TextEncoder()
		});

		if (!this.abiCache[act.account]) {
			this.abiCache[act.account] = await api.getAbi(act.account)
		}
		const builtinTypes = createInitialTypes()
		const types = getTypesFromAbi(builtinTypes, this.abiCache[act.account])

		const hexData = act.hex_data;
		const data = hexToUint8Array(hexData);

		const buffer = new SerialBuffer({textDecoder: new TextDecoder() as any, textEncoder: new TextEncoder()});
		buffer.pushArray(data);

		// You would use the struct representing the table row in your own code
		const transferType = types.get(act.name)
		if (transferType === undefined) {
			console.log("Type 'transfer' does not exist on 'eosio.token' ABI")
			return
		}

		act.data = transferType.deserialize(buffer);
	}
}
