import {
    AnalogToAnalogRequest,
    AnalogToDigitalRequest,
    DigitalToAnalogRequest,
    DigitalToDigitalRequest,
    SignalResponse
} from '../generated/signal';

export const SignalConversionDefinition = {
    name: 'SignalConversion',
    fullName: 'signal_scope.SignalConversion',
    methods: {
        analogToAnalog: {
            name: 'AnalogToAnalog',
            requestType: AnalogToAnalogRequest,
            requestStream: false,
            responseType: SignalResponse,
            responseStream: false,
            options: {},
        },
        analogToDigital: {
            name: 'AnalogToDigital',
            requestType: AnalogToDigitalRequest,
            requestStream: false,
            responseType: SignalResponse,
            responseStream: false,
            options: {},
        },
        digitalToAnalog: {
            name: 'DigitalToAnalog',
            requestType: DigitalToAnalogRequest,
            requestStream: false,
            responseType: SignalResponse,
            responseStream: false,
            options: {},
        },
        digitalToDigital: {
            name: 'DigitalToDigital',
            requestType: DigitalToDigitalRequest,
            requestStream: false,
            responseType: SignalResponse,
            responseStream: false,
            options: {},
        },
    },
} as const;
