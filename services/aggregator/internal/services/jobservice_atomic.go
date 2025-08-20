package services

import (
	"sync/atomic"
)

// JobServiceWrapper wraps the interface to ensure atomic.Value consistency
type JobServiceWrapper struct {
	Service JobServiceInterface
}

var JobServiceValue atomic.Value // holds *JobServiceWrapper

func InitJobServiceWarmingUp() {
	wrapper := &JobServiceWrapper{
		Service: &WarmingUpJobService{},
	}
	JobServiceValue.Store(wrapper)
}

func GetJobService() JobServiceInterface {
	wrapper := JobServiceValue.Load().(*JobServiceWrapper)
	return wrapper.Service
}

func SetJobService(service JobServiceInterface) {
	wrapper := &JobServiceWrapper{
		Service: service,
	}
	JobServiceValue.Store(wrapper)
}
