export type Stages = 'dev';

export interface EnvironmentProps {
    account: string;
}

export const environments: { [key in Stages]: EnvironmentProps } = {
  ['dev']: {
    account: '637423381395' // 自分のAWSアカウントID
  }
}