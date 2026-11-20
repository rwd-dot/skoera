import { inatResponse } from '../../../lib/inat.js';

export const onRequestGet = ({ env, request }) => inatResponse(env, request);
