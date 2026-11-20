import { json } from '../../../lib/util.js';

export const onRequestGet = ({ data }) => json(data.account);
