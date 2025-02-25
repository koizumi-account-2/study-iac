export type Stages = 'dev' | 'test' | 'prod';

export type EnvironmentProps = {
    account: string;
    region: string;
};

export const environmentProps: { [key in Stages]: EnvironmentProps } = {
    ['dev']: {
        account: 'AAA',
        region: 'ap-northeast-1'
    },
    ['test']: {
        account: 'BBB',
        region: 'ap-northeast-1'
    },
    ['prod']: {
        account: 'CCC',
        region: 'ap-northeast-1'
    }
};
