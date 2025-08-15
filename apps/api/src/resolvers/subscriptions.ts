import { withFilter } from "graphql-subscriptions";

export function getSubscriptionResolvers(pubsub: any, NEW_JOB: string) {
  return {
    newJob: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(NEW_JOB),
        (payload: any, variables: any) => {
          return payload.newJob.fitScore >= (variables.minFit || 0);
        }
      ),
    },
  };
}
