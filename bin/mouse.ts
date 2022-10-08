#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MouseStack } from '../lib/mouse-stack';

const app = new cdk.App();
new MouseStack(app, 'MouseStack');
