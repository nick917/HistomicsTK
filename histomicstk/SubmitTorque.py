import os
import subprocess


def SubmitTorque(JobString, JobID, Mem=512):
    """Submits a job to a Torque scheduler using qsub.
    Takes as input a string representing the contents of the job script file.
    This string defines a Linux command line call to Python that invokes a
    function and passes command line arguments using the -c python
    argument. The job string is specific to the algorithm/function
    and is generated by a separate script that interprets parameter
    values and generates the job string.

    Parameters
    ----------
    JobString : str
        Formatted string to invoke python function defining arguments.
    JobID : string
        String to assign name to job in PBS scheduler (-N option).
    Mem : int, optional
        Free memory parameter for 'mem_free', in MB, as defined by qsub.
    """

    # create job file in working directory
    Script = open(JobID + '.pbs', 'w')

    # add commands to CD to working directory
    Script.write('#!/bin/bash\n')
    Script.write('#PBS -j oe\n')
    Script.write('#PBS -k oe\n')
    Script.write('#PBS -V\n')
    Script.write('cd ${PBS_O_WORKDIR}\n\n')

    # print command to file
    if JobString[-1] != '\n':
        JobString = JobString + '\n'
    Script.write(JobString)

    # print wait command to job file
    # Script.write('wait $(ps | grep python | awk ''{print $2}'') && cat %s ' +
    #              JobID + '.txt\n')

    # close job file
    Script.close()

    # submit job through qsub via system call
    if(not JobID[0].isalpha()):
        JobID = '.' + JobID
    try:
        Result = subprocess.check_output('qsub -N ' + JobID + ' ' +
                                         JobID + '.pbs',
                                         stderr=subprocess.STDOUT, shell=True)
    except subprocess.CalledProcessError as error:
        Result = error

    print('qsub -N ' + JobID + ' ' + JobID + '.sh')

    # delete job file
    os.remove(JobID + '.pbs')

    # return output
    return(Result)
