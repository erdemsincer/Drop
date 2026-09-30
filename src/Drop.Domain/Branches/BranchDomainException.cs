using Drop.Domain.Common;

namespace Drop.Domain.Branches;

public sealed class BranchDomainException : DomainException
{
    public BranchDomainException(string code, string message)
        : base(code, message)
    {
    }
}
