import React, { Component } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native'
import { GooglePay, RequestDataType, AllowedCardNetworkType, AllowedCardAuthMethodsType } from 'react-native-google-pay'
import { jwtAuth } from "../tools/index.js";
import 'dotenv'

async function fitspacePay(req, res, next) {

    const tokenizationSpecification = async () => {
        type: 'PAYMENT_GATEWAY',
        parameters = {
          'gateway': 'example',
          'gatewayMerchantId': process.env.GOOGLE_MERCHANT_ID
        }
    }
    
    const createPaymentRequest = async (amount, currencyCode) => {
        return this.api.createPaymentRequest({
            amount: amount,
            currencyCode: currencyCode
        });
    }
      
    const processPaymentToken = async (paymentToken) => {
        return this.api.processPaymentToken(req.paymentToken);
    }
    
}

export default googlePay;